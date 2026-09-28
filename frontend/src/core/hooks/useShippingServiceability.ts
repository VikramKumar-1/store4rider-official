import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

interface ServiceabilityParams {
  pincode: string;
  weightKg: number;
  isCod?: boolean;
}

export function useShippingServiceability({ pincode, weightKg, isCod = false }: ServiceabilityParams) {
  return useQuery({
    queryKey: ["shipping", "serviceability", pincode, weightKg, isCod],
    queryFn: async () => {
      const response = await apiClient.post("/shipments/serviceability", {
        deliveryPincode: pincode,
        weightKg,
        isCod
      });
      return response.data.data;
    },
    // Only run if pincode is exactly 6 digits
    enabled: Boolean(pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)),
    staleTime: 1000 * 60 * 60, // Cache on client for 1 hour to prevent spamming
  });
}
