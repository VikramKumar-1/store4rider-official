import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IPincode } from "@store4riders/shared-types";

export function usePincodeLookup(pincode: string) {
  return useQuery({
    queryKey: ["pincode", pincode],
    queryFn: async (): Promise<IPincode | null> => {
      try {
        const response = await apiClient.get(`/pincodes/${pincode}`);
        return response.data?.data || null;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(pincode && pincode.length === 6 && /^\d{6}$/.test(pincode)),
    staleTime: Infinity, // Pincodes don't change
    retry: false
  });
}
