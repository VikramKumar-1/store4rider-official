import { AppError } from "../../../core/errors/AppError";
import { ShipmentModel } from "../shipment.model";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { logger } from "../../../core/utils/logger";

export class PickupService {
  
  /**
   * Scenario #8: Pickup scheduling and rescheduling.
   */
  static async schedulePickup(shipmentId: string, requestedDate: Date): Promise<void> {
    const shipment = await ShipmentModel.findById(shipmentId);
    
    if (!shipment) throw new AppError("Shipment not found", 404);
    if (!shipment.awb) throw new AppError("AWB is required to schedule pickup", 400);
    
    if (["PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED"].includes(shipment.status)) {
      throw new AppError(`Cannot schedule pickup. Shipment is already in state: ${shipment.status}`, 400);
    }

    try {
      const providerInstance = ShippingProviderFactory.getProvider(shipment.provider);
      logger.info(`[PickupService] Scheduling pickup via ${shipment.provider} for AWB ${shipment.awb} on ${requestedDate}`);
      
      const pickupResponse = await providerInstance.requestPickup(
        shipment.awb,
        shipment.providerShipmentId
      );

      if (pickupResponse.success) {
        shipment.pickupStatus = "SCHEDULED";
        shipment.pickupScheduledDate = requestedDate;
        // Keep main FSM status as READY_TO_SHIP if it was AWB_ASSIGNED
        if (shipment.status === "AWB_ASSIGNED" || shipment.status === "SHIPMENT_CREATED") {
           shipment.status = "READY_TO_SHIP";
        }
        await shipment.save();
        logger.info(`[PickupService] Pickup successfully scheduled for ${shipment.awb}`);
      } else {
        throw new Error(pickupResponse.message);
      }
    } catch (error: any) {
      shipment.pickupStatus = "FAILED";
      await shipment.save();
      logger.error(`[PickupService] Pickup scheduling failed for AWB ${shipment.awb}: ${error.message}`);
      throw new AppError(`Pickup Scheduling Failed: ${error.message}`, 500);
    }
  }

  /**
   * Called automatically by WebhookService or manually by Admin if pickup boy marks "Failed"
   */
  static async handlePickupFailure(shipmentId: string, reason: string): Promise<void> {
    const shipment = await ShipmentModel.findById(shipmentId);
    if (!shipment) return;

    shipment.pickupStatus = "FAILED";
    shipment.providerStatus = `Pickup Failed: ${reason}`;
    await shipment.save();
    
    logger.warn(`[PickupService] Pickup failed for AWB ${shipment.awb}. Ready for manual reschedule.`);
    // Notification Service can be called here to alert the warehouse manager.
  }
}
