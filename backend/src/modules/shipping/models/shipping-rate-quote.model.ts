import mongoose, { Schema, Document } from "mongoose";

export interface IShippingRateQuote extends Document {
  provider: string; // "shiprocket", "delhivery", "xpressbees"
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  isCod: boolean;
  
  // Rate Details
  totalCharge: number;
  baseFreight: number;
  codCharge?: number;
  
  // SLA / Performance
  estimatedDays: number;
  courierPartnerName?: string; // Especially for aggregators like Shiprocket
  
  // Availability
  isEligible: boolean;
  ineligibilityReason?: string; // e.g. "Overweight", "COD not supported"
  
  // Audit
  providerQuoteId?: string; // Unique quote ID from provider (if they provide one)
  expiresAt: Date; // TTL for cache
  createdAt: Date;
}

const ShippingRateQuoteSchema = new Schema<IShippingRateQuote>(
  {
    provider: { type: String, required: true },
    pickupPincode: { type: String, required: true },
    deliveryPincode: { type: String, required: true },
    weightKg: { type: Number, required: true },
    isCod: { type: Boolean, required: true },
    
    totalCharge: { type: Number, required: true },
    baseFreight: { type: Number, required: true },
    codCharge: { type: Number, default: 0 },
    
    estimatedDays: { type: Number, required: true },
    courierPartnerName: { type: String },
    
    isEligible: { type: Boolean, required: true },
    ineligibilityReason: { type: String },
    
    providerQuoteId: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL Index to automatically delete expired quotes
ShippingRateQuoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Composite index for fast lookup of valid quotes during checkout
ShippingRateQuoteSchema.index({ 
  pickupPincode: 1, 
  deliveryPincode: 1, 
  weightKg: 1, 
  isCod: 1 
});

export const ShippingRateQuoteModel = 
  mongoose.models.ShippingRateQuote || 
  mongoose.model<IShippingRateQuote>("ShippingRateQuote", ShippingRateQuoteSchema);
