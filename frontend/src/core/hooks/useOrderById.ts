import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IOrder } from "@store4riders/shared-types";

export function useOrderById(orderId: string) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${orderId}`);
      return response.data.data as IOrder;
    },
    enabled: !!orderId,
  });
}

export function useAdminOrderById(orderId: string) {
  return useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/admin/${orderId}`);
      return response.data.data as IOrder;
    },
    enabled: !!orderId,
  });
}
