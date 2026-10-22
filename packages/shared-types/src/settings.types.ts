export interface IPackagePreset {
  name: string;
  length: number;
  breadth: number;
  height: number;
}

export type GstPricingMode = "inclusive" | "exclusive";

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
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  returnWindowDays?: number;
  popularSearches?: string[];
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
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  returnWindowDays?: number;
  packagePresets?: IPackagePreset[];
}
