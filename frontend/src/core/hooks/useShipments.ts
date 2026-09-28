import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IShipment } from "@store4riders/shared-types";

export function useOrderShipments(orderId: string) {
  return useQuery({
    queryKey: ["shipments", "order", orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/shipments/order/${orderId}`);
      return response.data.data as IShipment[];
    },
    enabled: !!orderId,
  });
}
