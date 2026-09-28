import { AppError } from "../../../core/errors/AppError";
import { ShipmentModel } from "../shipment.model";
import { RateService } from "./rate.service";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { logger } from "../../../core/utils/logger";
import { IShipment } from "@store4riders/shared-types";

// Note: In a real system, this would be a BullMQ/RabbitMQ wrapper
import { ShipmentQueueService } from "./queue.service"; 

export class ShipmentService {
  
  /**
   * STEP 1: Synchronous DB Creation (Fast)
   * Called immediately after Payment is Successful.
   * Does NOT call external Courier APIs to prevent hanging the customer's checkout.
   */
  static async createPendingShipment(order: any, forcedProvider?: string): Promise<any> {
    
    // 1. Idempotency Check: Prevent duplicate shipment for the same order
    const existingShipment = await ShipmentModel.findOne({ orderId: order._id });
    if (existingShipment) {
      logger.info(`[ShipmentService] Shipment already exists for Order ${order._id}`);
      return existingShipment;
    }

    // 2. Select the Best Provider based on Admin Strategy or Manual Override
    const bestQuote = await RateService.selectBestProvider({
      pickupPincode: order.warehousePincode,
      deliveryPincode: order.shippingAddress.pincode,
      weightKg: order.totalWeightKg,
      isCod: order.paymentInfo.method === "cod",
      orderValue: order.pricing.finalTotal,
    }, "LOWEST_COST", 7, forcedProvider);

    // 3. Create the Database Record in STRICT "PENDING" State
    const newShipment = new ShipmentModel({
      orderId: order._id,
      provider: bestQuote.provider,
      shipmentType: "forward",
      status: "PENDING", // FSM initial state
      length: order.packageDimensions?.length || 10,
      breadth: order.packageDimensions?.breadth || 10,
      height: order.packageDimensions?.height || 10,
      weight: order.totalWeightKg,
      providerShippingCharge: bestQuote.totalCharge,
      
      // COD Partial Payment Logic Integration:
      // If customer paid an advance, we only tell the courier to collect the remainder.
      codFee: order.paymentInfo.method === "cod" ? order.pricing.codAmountToCollect : 0,
      
      idempotencyKey: `ship_${order._id}_${Date.now()}`
    });

    await newShipment.save();
    
    logger.info(`[ShipmentService] PENDING shipment created for Order ${order._id}. Pushing to Queue...`);

    // 4. Push to Background Queue (BullMQ) for async creation
    await ShipmentQueueService.addProviderCreationJob(newShipment._id);

    return newShipment;
  }

  /**
   * STEP 2: Asynchronous Execution (Worker Process)
   * This is called by the Queue (BullMQ) in the background.
   * Handles Retries, Timeouts, and Error marking.
   */
  static async processProviderShipmentCreation(shipmentId: string): Promise<void> {
    const shipment = await ShipmentModel.findById(shipmentId);
    if (!shipment) throw new Error("Shipment not found in DB");
    
    // Safety check: Don't process if it's already created
    if (shipment.status !== "PENDING" && shipment.status !== "UNKNOWN") {
      logger.warn(`[ShipmentService] Skipping creation. Shipment ${shipmentId} is already in state: ${shipment.status}`);
      return;
    }

    const providerInstance = ShippingProviderFactory.getProvider(shipment.provider);
    
    try {
      // In a real flow, we would fetch full order details here to map to provider payload
      // const order = await OrderModel.findById(shipment.orderId);
      const mockOrderPayloadForProvider = {
        orderId: shipment.orderId,
        weight: shipment.weight,
        isCod: shipment.codFee! > 0,
        codAmount: shipment.codFee, // Robust Partial COD passing
        // ... (address details would be passed here)
      };

      const providerResponse = await providerInstance.createShipment(mockOrderPayloadForProvider as any);

      // Success: Update FSM State
      shipment.providerShipmentId = providerResponse.shipmentId;
      shipment.awb = providerResponse.awb;
      shipment.status = "SHIPMENT_CREATED"; // Valid FSM Transition
      shipment.providerStatus = providerResponse.message || "Shipment Created";
      
      await shipment.save();
      logger.info(`[ShipmentService] Successfully created shipment ${shipmentId} via ${shipment.provider}`);
      
    } catch (error: any) {
      logger.error(`[ShipmentService] Provider API Failed for ${shipmentId}: ${error.message}`);
      
      const statusCode = error.response?.status;
      
      // Scenario #1 (Timeout / 5xx): Do NOT mark failed. Mark UNKNOWN/PENDING and Throw to let Queue retry.
      if (!statusCode || statusCode >= 500 || statusCode === 429 || statusCode === 408) {
        shipment.status = "UNKNOWN"; // Needs reconciliation later
        await shipment.save();
        
        // Throwing the error tells BullMQ to Retry with Exponential Backoff
        throw new AppError(`Provider unavailable. Queue will retry. ${error.message}`, 500);
      }
      
      // Scenario Validation Error (4xx like 400, 422): Do not retry. Mark FAILED.
      if (statusCode >= 400 && statusCode < 500) {
        shipment.status = "FAILED";
        shipment.providerStatus = error.message;
        await shipment.save();
        // Do not throw, we don't want the queue to blindly retry bad data (e.g. invalid pincode format)
        logger.warn(`[ShipmentService] Validation error. Marked shipment ${shipmentId} as FAILED. No retry.`);
      }
    }
  }
}
