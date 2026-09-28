import { AppError } from "../../../core/errors/AppError";
import { ShipmentModel } from "../shipment.model";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { logger } from "../../../core/utils/logger";

export class CancellationService {
  
  /**
   * Handles robust cancellation logic based on the strict FSM state of the shipment.
   */
  static async cancelShipment(shipmentId: string, reason: string): Promise<any> {
    const shipment = await ShipmentModel.findById(shipmentId);
    
    if (!shipment) {
      throw new AppError(`Shipment not found: ${shipmentId}`, 404);
    }

    const currentState = shipment.status;

    // Terminal states cannot be cancelled
    if (["CANCELLED", "DELIVERED", "FAILED", "RTO_DELIVERED", "LOST", "DAMAGED"].includes(currentState)) {
      throw new AppError(`Cannot cancel shipment. Current status is already a terminal state: ${currentState}`, 400);
    }

    // SCENARIO #9: Cancellation before shipment creation (No API call needed)
    if (currentState === "PENDING" || currentState === "UNKNOWN") {
      shipment.status = "CANCELLED";
      shipment.providerStatus = reason;
      await shipment.save();
      logger.info(`[CancellationService] Shipment ${shipmentId} cancelled internally before AWB creation.`);
      return { success: true, message: "Shipment cancelled internally." };
    }

    // SCENARIO #10: Cancellation after shipment creation / AWB generation
    if (["SHIPMENT_CREATED", "AWB_ASSIGNED", "READY_TO_SHIP"].includes(currentState)) {
      try {
        const providerInstance = ShippingProviderFactory.getProvider(shipment.provider);
        
        // Ensure provider has the awb or providerOrderId to cancel
        const referenceToCancel = shipment.awb || shipment.providerOrderId || shipment.providerShipmentId;
        if (!referenceToCancel) {
            throw new AppError("No valid provider reference found to cancel.", 500);
        }

        // Hit Provider API
        logger.info(`[CancellationService] Attempting provider cancellation for AWB ${referenceToCancel} via ${shipment.provider}`);
        const success = await providerInstance.cancelShipment(referenceToCancel, shipment.awb || "");
        
        // Update local state ONLY based on provider response
        if (success) {
          shipment.status = "CANCELLED";
          shipment.providerStatus = "Cancelled at provider: " + reason;
          await shipment.save();
          return { success: true, message: "Successfully cancelled with courier." };
        } else {
          throw new AppError(`Provider refused cancellation or failed to process.`, 400);
        }

      } catch (error: any) {
        logger.error(`[CancellationService] Cancellation failed for ${shipmentId}: ${error.message}`);
        throw new AppError(`Cancellation Failed: ${error.message}`, 500);
      }
    }

    // SCENARIO #11: Cancellation after pickup (In Transit)
    // We do NOT fake cancellation. Provider must initiate RTO.
    if (["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "NDR"].includes(currentState)) {
      logger.warn(`[CancellationService] Attempted to cancel shipment ${shipmentId} which is already in state ${currentState}`);
      throw new AppError(
        "Package has already been picked up. It cannot be cancelled directly. Please reject delivery to trigger an RTO.",
        400
      );
    }

    throw new AppError(`Unhandled cancellation state: ${currentState}`, 500);
  }
}
