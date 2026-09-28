import { AppError } from "../../../core/errors/AppError";
import { ShipmentModel } from "../shipment.model";
import { RateService } from "./rate.service";
import { ShipmentQueueService } from "./queue.service";
import { logger } from "../../../core/utils/logger";

export class ReturnShippingService {
  
  /**
   * SCENARIO #12: Customer Return.
   * Creates a dedicated Reverse Shipment (completely separate from the forward AWB).
   */
  static async createReverseShipment(
    originalOrderId: string, 
    pickupPincode: string, // Customer's Pincode
    warehousePincode: string, 
    weightKg: number,
    dimensions: { length: number; breadth: number; height: number }
  ): Promise<any> {
    
    logger.info(`[ReturnShippingService] Finding reverse rate for Order ${originalOrderId}`);

    // Reverse shipments are prepaid by the merchant. No COD fee.
    const bestQuote = await RateService.selectBestProvider({
      pickupPincode: pickupPincode,
      deliveryPincode: warehousePincode,
      weightKg: weightKg,
      isCod: false, // Merchant pays for return
      orderValue: 0, 
      dimensions
    }, "LOWEST_COST"); // Usually merchant wants lowest cost for returns

    // Create a new Reverse Shipment Record
    const reverseShipment = new ShipmentModel({
      orderId: originalOrderId,
      provider: bestQuote.provider,
      shipmentType: "reverse",
      status: "PENDING", 
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,
      weight: weightKg,
      providerShippingCharge: bestQuote.totalCharge,
      codFee: 0,
      idempotencyKey: `rev_ship_${originalOrderId}_${Date.now()}`
    });

    await reverseShipment.save();
    
    // Push to background queue to hit Courier API (just like forward shipments)
    await ShipmentQueueService.addProviderCreationJob(reverseShipment._id);

    return reverseShipment;
  }

  /**
   * SCENARIO #13: RTO (Return to Origin).
   * Note: RTO does NOT create a new shipment. It is an FSM state transition on the 
   * ORIGINAL forward shipment. The TrackingService handles the transitions 
   * (IN_TRANSIT -> RTO_INITIATED -> RTO_DELIVERED).
   * 
   * This helper function can be used by the warehouse/admin to acknowledge RTO receipt.
   */
  static async markRtoDeliveredAtWarehouse(awb: string): Promise<void> {
    const shipment = await ShipmentModel.findOne({ awb, shipmentType: "forward" });
    
    if (!shipment) {
      throw new AppError("Forward shipment not found for AWB", 404);
    }

    if (!["RTO_INITIATED", "RTO_IN_TRANSIT", "NDR"].includes(shipment.status)) {
      throw new AppError(`Shipment is in state ${shipment.status}. Cannot mark as RTO_DELIVERED.`, 400);
    }

    shipment.status = "RTO_DELIVERED";
    await shipment.save();
    
    logger.info(`[ReturnShippingService] Acknowledged RTO Delivered at warehouse for AWB ${awb}`);
  }
}
