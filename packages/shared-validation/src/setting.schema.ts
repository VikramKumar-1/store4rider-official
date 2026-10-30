import { z } from "zod";

export const packagePresetSchema = z.object({
  name: z.string().min(1),
  length: z.number().min(1),
  breadth: z.number().min(1),
  height: z.number().min(1),
});

export const footerLinkSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().min(1, "URL is required"),
  openInNewTab: z.boolean().optional(),
});

export const footerConfigSchema = z.object({
  aboutText: z.string().max(1000).optional().or(z.literal("")),
  showContact: z.boolean().optional(),
  contactPhone: z.string().max(50).optional().or(z.literal("")),
  contactEmail: z.string().max(100).optional().or(z.literal("")),
  contactAddress: z.string().max(300).optional().or(z.literal("")),
  showSocialLinks: z.boolean().optional(),
  column1Title: z.string().max(100).optional().or(z.literal("")),
  column1Links: z.array(footerLinkSchema).optional(),
  column2Title: z.string().max(100).optional().or(z.literal("")),
  column2Links: z.array(footerLinkSchema).optional(),
  newsletterTitle: z.string().max(100).optional().or(z.literal("")),
  newsletterSubtitle: z.string().max(300).optional().or(z.literal("")),
  newsletterPlaceholder: z.string().max(100).optional().or(z.literal("")),
  copyrightText: z.string().max(300).optional().or(z.literal("")),
  bottomLinks: z.array(footerLinkSchema).optional(),
});

export const policyPageSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional().or(z.literal("")),
  badge: z.string().optional().or(z.literal("")),
  lastUpdated: z.string().optional().or(z.literal("")),
  summaryAlertTitle: z.string().optional().or(z.literal("")),
  summaryAlertText: z.string().optional().or(z.literal("")),
  summaryAlertType: z.enum(["info", "warning", "success", "brand"]).optional(),
  contentHtml: z.string(),
  isActive: z.boolean().optional(),
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
  whatsappChatEnabled: z.boolean().optional(),
  whatsappDefaultMessage: z.string().max(500).optional().or(z.literal("")),
  facebookUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  returnWindowDays: z.number().min(0).max(365).optional(),
  popularSearches: z.array(z.string()).optional(),
  snapmintMinOrderValue: z.number().min(0).optional(),
  brandsMetaTitle: z.string().max(200).optional().or(z.literal("")),
  brandsMetaDescription: z.string().max(500).optional().or(z.literal("")),
  brandsMetaKeywords: z.string().max(500).optional().or(z.literal("")),
  guidesMetaTitle: z.string().max(200).optional().or(z.literal("")),
  guidesMetaDescription: z.string().max(500).optional().or(z.literal("")),
  guidesMetaKeywords: z.string().max(500).optional().or(z.literal("")),
  guidesHeroTitle: z.string().max(200).optional().or(z.literal("")),
  guidesHeroDescription: z.string().max(1000).optional().or(z.literal("")),
  footerConfig: footerConfigSchema.optional(),
  policyPages: z.array(policyPageSchema).optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
