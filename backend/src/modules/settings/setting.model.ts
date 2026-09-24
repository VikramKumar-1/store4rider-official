/**
 * @file setting.model.ts
 * @description Mongoose schema and model definition for Store Settings.
 * Stores global configurations controlled by the Admin panel.
 */
import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  taxRate: number;
  freeShippingThreshold: number;
  shippingCost: number;
  enabledGateways: string[];
  codPartialPaymentType: "percentage" | "fixed";
  codPartialPaymentValue: number;
  storeOriginPincode: string;
  storeOriginCity: string;
  storeOriginAddress: string;
  storeOriginPhone: string;
}

const settingSchema = new Schema<ISetting>(
  {
    taxRate: { type: Number, required: true, default: 18 },
    freeShippingThreshold: { type: Number, required: true, default: 999 },
    shippingCost: { type: Number, required: true, default: 49 },
    enabledGateways: { type: [String], default: ["payu", "cod"] },
    codPartialPaymentType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    codPartialPaymentValue: { type: Number, default: 20 },
    storeOriginPincode: { type: String, default: "411001" },
    storeOriginCity: { type: String, default: "Pune" },
    storeOriginAddress: { type: String, default: "Store4Riders Warehouse" },
    storeOriginPhone: { type: String, default: "9876543210" },
  },
  { timestamps: true }
);

export const SettingModel = mongoose.models.Setting || mongoose.model<ISetting>("Setting", settingSchema);
