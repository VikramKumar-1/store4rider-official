import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IPincode } from "@store4riders/shared-types";

export function usePincodeLookup(pincode: string) {
  return useQuery({
    queryKey: ["pincode", pincode],
    queryFn: async (): Promise<IPincode> => {
      // It might be /pincodes or /pincode, we try /pincode first
      const response = await apiClient.get(`/pincodes/${pincode}`).catch(() => apiClient.get(`/pincode/${pincode}`));
      return response.data.data;
    },
    enabled: Boolean(pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)),
    staleTime: Infinity, // Pincodes don't change
    retry: 1
  });
}
