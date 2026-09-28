import mongoose, { Schema, Document } from "mongoose";

export interface IProviderSetting {
  providerName: string; // "shiprocket", "delhivery", "xpressbees"
  isActive: boolean;
  priority: number; // 1 is highest priority
}

export interface IShippingSettings extends Document {
  providers: IProviderSetting[];
  defaultStrategy: "LOWEST_COST" | "FASTEST_DELIVERY" | "LOWEST_COST_WITHIN_SLA";
  globalShippingPause: boolean; // Emergency Master Switch
  updatedBy?: string; // Admin who last changed settings
  updatedAt: Date;
}

const ShippingSettingsSchema = new Schema<IShippingSettings>(
  {
    providers: [
      {
        providerName: { type: String, required: true },
        isActive: { type: Boolean, default: true },
        priority: { type: Number, default: 1 },
      }
    ],
    defaultStrategy: {
      type: String,
      enum: ["LOWEST_COST", "FASTEST_DELIVERY", "LOWEST_COST_WITHIN_SLA"],
      default: "LOWEST_COST"
    },
    globalShippingPause: { type: Boolean, default: false },
    updatedBy: { type: String }
  },
  { timestamps: true }
);

export const ShippingSettingsModel = 
  mongoose.models.ShippingSettings || 
  mongoose.model<IShippingSettings>("ShippingSettings", ShippingSettingsSchema);
