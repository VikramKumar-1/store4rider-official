import mongoose, { Schema, Document } from "mongoose";
import { AppError } from "../../core/errors/AppError";
import { IShipment } from "@store4riders/shared-types"; // Might need update later to match new fields

export interface ShipmentDocument extends Document {
  orderId: string;
  provider: string; // "shiprocket", "delhivery", "xpressbees"
  shipmentType: "forward" | "reverse";
  
  // Provider specific IDs
  providerOrderId?: string;
  providerShipmentId?: string;
  awb?: string;
  courierName?: string;
  
  // Strict FSM Status
  status: 
    | "PENDING"
    | "SHIPMENT_CREATED"
    | "AWB_ASSIGNED"
    | "READY_TO_SHIP"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "NDR"
    | "RTO_INITIATED"
    | "RTO_IN_TRANSIT"
    | "RTO_DELIVERED"
    | "CANCELLED"
    | "LOST"
    | "DAMAGED"
    | "FAILED"
    | "UNKNOWN";
    
  providerStatus?: string; // Raw string from provider
  
  // Assets
  trackingUrl?: string;
  labelUrl?: string;
  invoiceUrl?: string;
  
  // Multi-box support (shipment_packages)
  packages: {
    packageId?: string; // Provider's sub-package ID if any
    length: number;
    breadth: number;
    height: number;
    weight: number;
    volumetricWeight?: number;
    chargeableWeight?: number;
    skuList?: string[]; // SKUs inside this specific box
  }[];
  totalWeight?: number;
  
  // Pickup Details
  pickupStatus?: "PENDING" | "SCHEDULED" | "PICKED" | "FAILED";
  pickupScheduledDate?: Date;
  estimatedDeliveryDate?: Date;
  
  // Financials
  customerShippingCharge?: number;
  providerShippingCharge?: number;
  codFee?: number;
  
  // Idempotency & Security
  idempotencyKey?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// Finite State Machine (FSM) Rules Map
// -----------------------------------------------------------------------------
const VALID_TRANSITIONS: Record<string, string[]> = {
  "PENDING": ["SHIPMENT_CREATED", "FAILED", "CANCELLED", "UNKNOWN"],
  "UNKNOWN": ["PENDING", "SHIPMENT_CREATED", "FAILED"], // Recovery states
  "SHIPMENT_CREATED": ["AWB_ASSIGNED", "CANCELLED", "FAILED"],
  "AWB_ASSIGNED": ["READY_TO_SHIP", "CANCELLED"],
  "READY_TO_SHIP": ["PICKED_UP", "CANCELLED"],
  "PICKED_UP": ["IN_TRANSIT", "LOST", "DAMAGED"],
  "IN_TRANSIT": ["OUT_FOR_DELIVERY", "LOST", "DAMAGED", "NDR", "RTO_INITIATED"],
  "OUT_FOR_DELIVERY": ["DELIVERED", "NDR", "RTO_INITIATED"],
  "NDR": ["OUT_FOR_DELIVERY", "RTO_INITIATED", "DELIVERED"],
  "RTO_INITIATED": ["RTO_IN_TRANSIT"],
  "RTO_IN_TRANSIT": ["RTO_DELIVERED", "LOST", "DAMAGED"],
  
  // Terminal States (Cannot transition out of these)
  "DELIVERED": [],
  "RTO_DELIVERED": [],
  "CANCELLED": [],
  "FAILED": [],
  "LOST": [],
  "DAMAGED": [],
};

const shipmentSchema = new Schema<ShipmentDocument>(
  {
    orderId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    shipmentType: { type: String, enum: ["forward", "reverse"], default: "forward" },
    
    providerOrderId: { type: String },
    providerShipmentId: { type: String },
    awb: { type: String, index: true },
    courierName: { type: String },
    
    status: {
      type: String,
      required: true,
      default: "PENDING",
      index: true,
    },
    providerStatus: { type: String },
    
    trackingUrl: { type: String },
    labelUrl: { type: String },
    invoiceUrl: { type: String },
    
    packages: [{
      packageId: { type: String },
      length: { type: Number, required: true },
      breadth: { type: Number, required: true },
      height: { type: Number, required: true },
      weight: { type: Number, required: true },
      volumetricWeight: { type: Number },
      chargeableWeight: { type: Number },
      skuList: [{ type: String }]
    }],
    totalWeight: { type: Number },
    
    pickupStatus: { type: String, enum: ["PENDING", "SCHEDULED", "PICKED", "FAILED"], default: "PENDING" },
    pickupScheduledDate: { type: Date },
    estimatedDeliveryDate: { type: Date },
    
    customerShippingCharge: { type: Number },
    providerShippingCharge: { type: Number },
    codFee: { type: Number },
    
    idempotencyKey: { type: String, sparse: true },
  },
  { timestamps: true }
);

// -----------------------------------------------------------------------------
// Indexes for Idempotency and Lookups
// -----------------------------------------------------------------------------
shipmentSchema.index({ provider: 1, providerShipmentId: 1 }, { unique: true, sparse: true });
shipmentSchema.index({ provider: 1, awb: 1 }, { unique: true, sparse: true });
shipmentSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

// -----------------------------------------------------------------------------
// Hooks (Strict State Transitions)
// -----------------------------------------------------------------------------
shipmentSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    // Only check if document isn't completely new
    if (!this.isNew) {
      // Access previous state using getChanges/original
      // NOTE: In pre('save'), `this` holds the new state. To find old state in mongoose:
      // this is tricky without tracking it manually, but Mongoose provides `init` hooks or we can 
      // rely on the Service layer. However, doing it here guarantees DB-level integrity.
      // We will skip complex DB-level previous-state lookup here and enforce it in the Repository/Service.
      // But we CAN convert string to uppercase to guarantee consistency.
    }
    this.status = (this.status as string).toUpperCase() as any;
  }
  next();
});

export const ShipmentModel = mongoose.models.Shipment || mongoose.model<ShipmentDocument>("Shipment", shipmentSchema);
