import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IFooterConfig } from "@store4riders/shared-types";

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
  gstPricingMode?: "inclusive" | "exclusive";
  allowB2bGstin?: boolean;
  storeOriginState?: string;
  storeOriginCity?: string;
  storeOriginPincode?: string;
  storeOriginAddress?: string;
  supportPhone?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  returnWindowDays?: number;
  snapmintMinOrderValue?: number;
  footerConfig?: IFooterConfig;
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ["publicSettings"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: IPublicSettings }>("/settings/public");
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
