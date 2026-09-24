import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export interface IPublicSettings {
  enabledGateways: string[];
  codPartialPaymentType?: "percentage" | "fixed";
  codPartialPaymentValue?: number;
  taxRate: number;
  freeShippingThreshold: number;
  shippingCost: number;
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
