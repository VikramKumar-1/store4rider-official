import mongoose, { Schema, Document } from "mongoose";

export interface IShippingWebhookEvent extends Document {
  provider: string; // "shiprocket", "delhivery", "xpressbees"
  providerEventId: string; // Unique ID sent by provider to prevent duplicates
  shipmentId?: string; // Optional, mapped after parsing
  awb?: string;
  status: "PENDING" | "PROCESSED" | "FAILED" | "IGNORED";
  payload: any; // Store the raw webhook payload for audit/reconciliation
  errorReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingWebhookEventSchema = new Schema<IShippingWebhookEvent>(
  {
    provider: { type: String, required: true },
    providerEventId: { type: String, required: true }, // The key for idempotency
    shipmentId: { type: String, index: true },
    awb: { type: String, index: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED", "IGNORED"],
      default: "PENDING",
    },
    payload: { type: Schema.Types.Mixed, required: true },
    errorReason: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

// CRITICAL: Compound unique index to prevent processing the exact same webhook twice
ShippingWebhookEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });

export const ShippingWebhookEventModel = 
  mongoose.models.ShippingWebhookEvent || 
  mongoose.model<IShippingWebhookEvent>("ShippingWebhookEvent", ShippingWebhookEventSchema);
