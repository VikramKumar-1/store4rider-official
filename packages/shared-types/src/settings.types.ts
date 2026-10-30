export interface IPackagePreset {
  name: string;
  length: number;
  breadth: number;
  height: number;
}

export type GstPricingMode = "inclusive" | "exclusive";

export interface IFooterLink {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

export interface IFooterConfig {
  aboutText?: string;
  showContact?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  showSocialLinks?: boolean;
  column1Title?: string;
  column1Links?: IFooterLink[];
  column2Title?: string;
  column2Links?: IFooterLink[];
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  newsletterPlaceholder?: string;
  copyrightText?: string;
  bottomLinks?: IFooterLink[];
}

export interface IPolicyPageConfig {
  slug: string;
  title: string;
  subtitle?: string;
  badge?: string;
  lastUpdated?: string;
  summaryAlertTitle?: string;
  summaryAlertText?: string;
  summaryAlertType?: "info" | "warning" | "success" | "brand";
  contentHtml: string;
  isActive?: boolean;
}

export interface ISetting {
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
  packagePresets: IPackagePreset[];
  gstin?: string;
  legalBusinessName?: string;
  pan?: string;
  gstPricingMode?: GstPricingMode;
  allowB2bGstin?: boolean;
  supportPhone?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  whatsappChatEnabled?: boolean;
  whatsappDefaultMessage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  returnWindowDays?: number;
  popularSearches?: string[];
  footerConfig?: IFooterConfig;
  policyPages?: IPolicyPageConfig[];
}

export interface IPublicSettings {
  enabledGateways: string[];
  codPartialPaymentEnabled?: boolean;
  codPartialPaymentType?: "percentage" | "fixed";
  codPartialPaymentValue?: number;
  taxRate: number;
  freeShippingThreshold: number;
  shippingCost: number;
  gstin?: string;
  legalBusinessName?: string;
  gstPricingMode?: GstPricingMode;
  allowB2bGstin?: boolean;
  storeOriginState?: string;
  storeOriginCity?: string;
  storeOriginPincode?: string;
  storeOriginAddress?: string;
  storeOriginPhone?: string;
  supportPhone?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  whatsappChatEnabled?: boolean;
  whatsappDefaultMessage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  returnWindowDays?: number;
  packagePresets?: IPackagePreset[];
  footerConfig?: IFooterConfig;
  policyPages?: IPolicyPageConfig[];
}
