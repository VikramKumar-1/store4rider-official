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
}

const settingSchema = new Schema<ISetting>(
  {
    taxRate: { type: Number, required: true, default: 18 },
    freeShippingThreshold: { type: Number, required: true, default: 999 },
    shippingCost: { type: Number, required: true, default: 49 },
  },
  { timestamps: true }
);

export const SettingModel = mongoose.models.Setting || mongoose.model<ISetting>("Setting", settingSchema);
