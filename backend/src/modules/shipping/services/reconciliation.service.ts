import { ShipmentModel } from "../shipment.model";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { TrackingService, NormalizedTrackingEvent } from "./tracking.service";
import { logger } from "../../../core/utils/logger";

export class ReconciliationService {
  
  /**
   * Skip 1: Missed Webhook Reconciliation (Cron Job Task).
   * Finds shipments that haven't been updated in 24 hours and proactively 
   * asks the courier for their latest status.
   */
  static async reconcileStuckShipments(): Promise<void> {
    logger.info("[ReconciliationService] Starting reconciliation job for stuck shipments.");
    
    // 24 hours ago
    const thresholdTime = new Date(Date.now() - 24 * 60 * 60 * 1000); 

    // Find shipments stuck in transient states without updates for > 24h
    const stuckShipments = await ShipmentModel.find({
      status: { $in: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"] },
      updatedAt: { $lt: thresholdTime }
    }).exec();

    if (stuckShipments.length === 0) {
      logger.info("[ReconciliationService] No stuck shipments found.");
      return;
    }

    logger.info(`[ReconciliationService] Found ${stuckShipments.length} stuck shipments. Polling providers...`);

    for (const shipment of stuckShipments) {
      if (!shipment.awb) continue;

      try {
        const providerInstance = ShippingProviderFactory.getProvider(shipment.provider);
        const latestStatus = await providerInstance.getTrackingInfo(shipment.awb);
        const lastEvent = latestStatus.events?.[0];

        // Map provider response to our Normalized Event Format
        const normalizedEvent: NormalizedTrackingEvent = {
          awb: shipment.awb,
          provider: shipment.provider,
          internalState: latestStatus.currentStatus as any,
          providerState: lastEvent?.status || latestStatus.currentStatus,
          location: lastEvent?.location || "System Reconciliation",
          eventTimestamp: lastEvent?.timestamp ? new Date(lastEvent.timestamp) : new Date(),
          message: "Reconciled via CRON"
        };

        // Reuse our strict FSM updater from TrackingService
        await TrackingService.processTrackingEvent(normalizedEvent);
        
      } catch (error: any) {
        logger.error(`[ReconciliationService] Failed to reconcile AWB ${shipment.awb}: ${error.message}`);
        // We do not fail the whole cron loop if one provider times out
      }
    }

    logger.info("[ReconciliationService] Reconciliation job completed.");
  }
}
