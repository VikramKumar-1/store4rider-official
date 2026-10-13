import { z } from "zod";

export const packagePresetSchema = z.object({
  name: z.string().min(1),
  length: z.number().min(1),
  breadth: z.number().min(1),
  height: z.number().min(1),
});

export const updateSettingSchema = z.object({
  taxRate: z.number().min(0).max(100).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  enabledGateways: z.array(z.string()).optional(),
  codPartialPaymentEnabled: z.boolean().optional(),
  codPartialPaymentType: z.enum(["percentage", "fixed"]).optional(),
  codPartialPaymentValue: z.number().min(0).optional(),
  storeOriginPincode: z.string().optional(),
  storeOriginCity: z.string().optional(),
  storeOriginState: z.string().optional(),
  storeOriginAddress: z.string().optional(),
  storeOriginPhone: z.string().optional(),
  packagePresets: z.array(packagePresetSchema).optional(),
  gstin: z.string().optional(),
  legalBusinessName: z.string().optional(),
  pan: z.string().optional(),
  gstPricingMode: z.enum(["inclusive", "exclusive"]).optional(),
  allowB2bGstin: z.boolean().optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().optional(),
  whatsappNumber: z.string().optional(),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  returnWindowDays: z.number().min(0).max(365).optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
