import mongoose, { Schema, Document } from "mongoose";

export interface IShippingTrackingEvent extends Document {
  shipmentId: string; // Internal Shipment ID
  awb: string;
  provider: string;
  internalState: string; // Our normalized state (e.g., 'OUT_FOR_DELIVERY')
  providerState: string; // Provider's raw state string (e.g., 'Out For Delivery')
  location?: string;
  message?: string;
  eventTimestamp: Date; // When the event actually happened
  createdAt: Date; // When we recorded it
}

const ShippingTrackingEventSchema = new Schema<IShippingTrackingEvent>(
  {
    shipmentId: { type: String, required: true, index: true },
    awb: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    internalState: { type: String, required: true },
    providerState: { type: String, required: true },
    location: { type: String },
    message: { type: String },
    eventTimestamp: { type: Date, required: true },
  },
  { 
    timestamps: { createdAt: true, updatedAt: false } // Tracking events don't update
  }
);

// Optimize queries for finding a shipment's full history chronologically
ShippingTrackingEventSchema.index({ shipmentId: 1, eventTimestamp: -1 });
// Compound unique index to prevent duplicate tracking logs for the same state change at the same time
ShippingTrackingEventSchema.index({ shipmentId: 1, internalState: 1, eventTimestamp: 1 }, { unique: true });

export const ShippingTrackingEventModel = 
  mongoose.models.ShippingTrackingEvent || 
  mongoose.model<IShippingTrackingEvent>("ShippingTrackingEvent", ShippingTrackingEventSchema);
