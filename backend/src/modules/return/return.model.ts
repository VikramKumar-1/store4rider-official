import mongoose, { Schema, Document } from "mongoose";

export interface IReturnItem {
  productId: string;
  variantId?: string;
  quantity: number;
  reason: string;
}

export interface IReturn extends Document {
  orderId: string;
  userId: string;
  shipmentId?: string; // If a reverse shipment is created
  
  // The Return Lifecycle
  status: 
    | "requested"           // Customer clicked "Return"
    | "pickup_assigned"     // Courier assigned for reverse pickup
    | "picked_up"           // Courier took it from customer
    | "reached_facility"    // Sack arrived at warehouse (Webhook triggered - NO TIMER YET)
    | "inwarded_for_qc"     // Admin scanned barcode (TIMER STARTS NOW)
    | "qc_failed"           // Admin rejected it (e.g. brick in box)
    | "refunded"            // Full refund done
    | "partially_refunded"  // Admin deducted amount and refunded rest
    | "cancelled";          // Return request cancelled by user

  items: IReturnItem[];
  
  // Refund Configuration
  refundMethod: "original_source" | "upi" | "bank_transfer" | "wallet";
  refundAmount: number;     // Expected refund
  actualRefundedAmount?: number; // What admin actually refunded in case of partial
  
  // Bank/UPI Details (Provided by customer for COD)
  upiId?: string;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };

  // Timestamps for SLA checking
  inwardedAt?: Date;        // CRITICAL: When warehouse scanned the barcode
  qcCompletedAt?: Date;     // When admin clicked Approve/Reject
  
  // Notes
  qcNotes?: string;         // Why admin did partial/reject
  
  // Courier Dispute Tracking
  courierDispute?: boolean;
  disputeStatus?: "pending" | "claim_raised" | "claim_approved" | "claim_rejected";

  createdAt: Date;
  updatedAt: Date;
}

const ReturnSchema = new Schema<IReturn>(
  {
    orderId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    shipmentId: { type: String },
    
    status: {
      type: String,
      enum: [
        "requested",
        "pickup_assigned",
        "picked_up",
        "reached_facility",
        "inwarded_for_qc",
        "qc_failed",
        "refunded",
        "partially_refunded",
        "cancelled"
      ],
      default: "requested"
    },
    
    items: [{
      productId: { type: String, required: true },
      variantId: { type: String },
      quantity: { type: Number, required: true },
      reason: { type: String, required: true }
    }],

    refundMethod: {
      type: String,
      enum: ["original_source", "upi", "bank_transfer", "wallet"],
      required: true
    },
    refundAmount: { type: Number, required: true },
    actualRefundedAmount: { type: Number },

    upiId: { type: String },
    bankDetails: {
      accountNumber: { type: String },
      ifsc: { type: String },
      accountHolderName: { type: String }
    },

    inwardedAt: { type: Date },
    qcCompletedAt: { type: Date },
    qcNotes: { type: String },

    courierDispute: { type: Boolean, default: false },
    disputeStatus: { 
      type: String, 
      enum: ["pending", "claim_raised", "claim_approved", "claim_rejected"] 
    },
  },
  { timestamps: true }
);

// Prevent hot-reload crashes in Next.js
export const ReturnModel = mongoose.models.Return || mongoose.model<IReturn>("Return", ReturnSchema);
