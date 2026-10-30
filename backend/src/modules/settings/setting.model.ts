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
  codPartialPaymentEnabled: boolean;
  codPartialPaymentType: "percentage" | "fixed";
  codPartialPaymentValue: number;
  storeOriginPincode: string;
  storeOriginCity: string;
  storeOriginState: string;
  storeOriginAddress: string;
  storeOriginPhone: string;
  packagePresets: { name: string; length: number; breadth: number; height: number }[];
  gstin?: string;
  legalBusinessName?: string;
  pan?: string;
  gstPricingMode?: "inclusive" | "exclusive";
  allowB2bGstin?: boolean;
  supportPhone?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  returnWindowDays?: number;
  popularSearches?: string[];
  snapmintMinOrderValue?: number;
  brandsMetaTitle?: string;
  brandsMetaDescription?: string;
  brandsMetaKeywords?: string;
  guidesMetaTitle?: string;
  guidesMetaDescription?: string;
  guidesMetaKeywords?: string;
  guidesHeroTitle?: string;
  guidesHeroDescription?: string;
}

const settingSchema = new Schema<ISetting>(
  {
    taxRate: { type: Number, required: true, default: 18 },
    freeShippingThreshold: { type: Number, required: true, default: 999 },
    shippingCost: { type: Number, required: true, default: 49 },
    enabledGateways: { type: [String], default: ["payu", "cod"] },
    codPartialPaymentEnabled: { type: Boolean, default: false },
    codPartialPaymentType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    codPartialPaymentValue: { type: Number, default: 20 },
    snapmintMinOrderValue: { type: Number, default: 25000 },
    storeOriginPincode: { type: String, default: "411001" },
    storeOriginCity: { type: String, default: "Pune" },
    storeOriginState: { type: String, default: "Maharashtra" },
    storeOriginAddress: { type: String, default: "Store4Riders Warehouse" },
    storeOriginPhone: { type: String, default: "" },
    gstin: { type: String, default: "" },
    legalBusinessName: { type: String, default: "Store4Riders" },
    pan: { type: String, default: "" },
    gstPricingMode: { type: String, enum: ["inclusive", "exclusive"], default: "inclusive" },
    allowB2bGstin: { type: Boolean, default: true },
    supportPhone: { type: String, default: "" },
    supportEmail: { type: String, default: "contact@store4riders.com" },
    whatsappNumber: { type: String, default: "" },
    facebookUrl: { type: String, default: "https://www.facebook.com/store4riders/" },
    instagramUrl: { type: String, default: "https://www.instagram.com/store4riders/" },
    youtubeUrl: { type: String, default: "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg" },
    twitterUrl: { type: String, default: "https://twitter.com/store4riders" },
    returnWindowDays: { type: Number, default: 7 },
    popularSearches: { type: [String], default: [] },
    brandsMetaTitle: { type: String, default: "" },
    brandsMetaDescription: { type: String, default: "" },
    brandsMetaKeywords: { type: String, default: "" },
    guidesMetaTitle: { type: String, default: "" },
    guidesMetaDescription: { type: String, default: "" },
    guidesMetaKeywords: { type: String, default: "" },
    guidesHeroTitle: { type: String, default: "Motorcycle Guides & Expert Advice" },
    guidesHeroDescription: { type: String, default: "Real-world gear tests, sizing walkthroughs, maintenance checklists, and touring preparation guides curated by riders for Indian roads and conditions." },
    packagePresets: { 
      type: [{ name: String, length: Number, breadth: Number, height: Number }], 
      default: [
        { name: "Small Box (Accessories)", length: 15, breadth: 15, height: 10 },
        { name: "Medium Box (Jackets/Boots)", length: 30, breadth: 30, height: 15 },
        { name: "Large Box (Helmets)", length: 40, breadth: 30, height: 30 }
      ]
    }
  },
  { timestamps: true }
);

export const SettingModel = mongoose.models.Setting || mongoose.model<ISetting>("Setting", settingSchema);
