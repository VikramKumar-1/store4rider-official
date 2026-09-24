import mongoose, { Schema, Document } from "mongoose";
import { IPayment } from "@store4riders/shared-types";

export interface PaymentDocument extends Omit<IPayment, 'id'>, Document {}

const refundSchema = new Schema(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const paymentSchema = new Schema<PaymentDocument>(
  {
    orderId: { type: String, required: true },
    status: {
      type: String,
      enum: ["created", "pending", "captured", "failed", "refunded", "partially_refunded"],
      default: "created",
      required: true,
    },
    amount: { type: Number, required: true },
    gatewayOrderId: { type: String, required: true },
    gatewayPaymentId: { type: String, required: false },
    method: {
      type: String,
      enum: ["cod", "payu", "ccavenue", "snapmint", "upi"],
      required: true,
    },
    gateway: {
      type: String,
      enum: ["payu", "ccavenue", "snapmint"],
      required: true,
    },
    refunds: { type: [refundSchema], default: [] },
    webhookEvents: { type: [String], default: [] },
    idempotencyKey: { type: String, required: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<PaymentDocument>("Payment", paymentSchema);
