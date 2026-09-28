import { AppError } from "../../../core/errors/AppError";
import { ShipmentModel } from "../shipment.model";
import { ShippingTrackingEventModel } from "../models/shipping-tracking-event.model";
import { logger } from "../../../core/utils/logger";

// Mapping valid forward transitions (Finite State Machine Rules)
const VALID_TRANSITIONS: Record<string, string[]> = {
  "PENDING": ["SHIPMENT_CREATED", "FAILED", "CANCELLED", "UNKNOWN"],
  "UNKNOWN": ["PENDING", "SHIPMENT_CREATED", "FAILED"],
  "SHIPMENT_CREATED": ["AWB_ASSIGNED", "CANCELLED", "FAILED"],
  "AWB_ASSIGNED": ["READY_TO_SHIP", "CANCELLED"],
  "READY_TO_SHIP": ["PICKED_UP", "CANCELLED"],
  "PICKED_UP": ["IN_TRANSIT", "LOST", "DAMAGED"],
  "IN_TRANSIT": ["OUT_FOR_DELIVERY", "LOST", "DAMAGED", "NDR", "RTO_INITIATED"],
  "OUT_FOR_DELIVERY": ["DELIVERED", "NDR", "RTO_INITIATED"],
  "NDR": ["OUT_FOR_DELIVERY", "RTO_INITIATED", "DELIVERED"],
  "RTO_INITIATED": ["RTO_IN_TRANSIT"],
  "RTO_IN_TRANSIT": ["RTO_DELIVERED", "LOST", "DAMAGED"],
  
  // Terminal States (Immutable)
  "DELIVERED": [],
  "RTO_DELIVERED": [],
  "CANCELLED": [],
  "FAILED": [],
  "LOST": [],
  "DAMAGED": [],
};

export interface NormalizedTrackingEvent {
  awb: string;
  provider: string;
  internalState: string; // FSM State (e.g. OUT_FOR_DELIVERY)
  providerState: string; // Raw state from provider (e.g. "Out For Delivery")
  location?: string;
  message?: string;
  eventTimestamp: Date;
}

export class TrackingService {
  
  /**
   * Processes a normalized tracking event.
   * Ensures strict state transitions and saves historical timeline.
   */
  static async processTrackingEvent(event: NormalizedTrackingEvent): Promise<void> {
    
    // 1. Find the parent shipment
    const shipment = await ShipmentModel.findOne({ awb: event.awb, provider: event.provider });
    if (!shipment) {
      throw new AppError(`Shipment not found for AWB: ${event.awb}`, 404);
    }

    const currentState = shipment.status;
    const newState = event.internalState.toUpperCase();

    // 2. Validate FSM State Transition
    // If the state is the same, we still record the tracking history event (e.g. ping in transit), 
    // but we don't need to change the parent shipment state.
    if (currentState !== newState) {
      const allowedNextStates = VALID_TRANSITIONS[currentState] || [];
      
      if (!allowedNextStates.includes(newState)) {
        logger.warn(`[TrackingService] Invalid FSM transition for AWB ${event.awb}: ${currentState} -> ${newState}. Skipping parent status update.`);
        // We do NOT throw an error here, because we still want to save the Tracking History log below.
      } else {
        // Valid transition. Update the parent shipment.
        shipment.status = newState as any;
        shipment.providerStatus = event.providerState;
        
        // Handle specific terminal/critical actions if needed
        if (newState === "DELIVERED") {
          // E.g., Queue notification to customer, update Order status
          logger.info(`[TrackingService] Package DELIVERED for AWB ${event.awb}. Triggering success workflow.`);
        }
        
        await shipment.save();
      }
    }

    // 3. Save to Historical Tracking Log (ShippingTrackingEvent)
    try {
      const trackingRecord = new ShippingTrackingEventModel({
        shipmentId: shipment._id,
        awb: event.awb,
        provider: event.provider,
        internalState: newState,
        providerState: event.providerState,
        location: event.location,
        message: event.message,
        eventTimestamp: event.eventTimestamp,
      });

      await trackingRecord.save();
      logger.info(`[TrackingService] Saved historical event [${newState}] for AWB ${event.awb}`);
      
    } catch (error: any) {
      // 11000 is MongoDB's Duplicate Key Error Code
      if (error.code === 11000) {
        logger.warn(`[TrackingService] Duplicate tracking history ignored for AWB ${event.awb} at ${event.eventTimestamp}`);
      } else {
        throw error;
      }
    }
  }
}
