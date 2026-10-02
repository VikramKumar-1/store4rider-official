import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useIndianStates() {
  return useQuery({
    queryKey: ["indian-states"],
    queryFn: async (): Promise<string[]> => {
      const response = await apiClient.get(`/pincodes/states`);
      return response.data.data;
    },
    staleTime: Infinity, // States list does not change often
  });
}
