import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IShipment } from "@store4riders/shared-types";

interface GetShipmentsParams {
  page?: number;
  limit?: number;
  provider?: string;
  status?: string;
  search?: string;
}

export function useAdminShipments(params: GetShipmentsParams = {}) {
  return useQuery({
    queryKey: ["admin", "shipments", params],
    queryFn: async () => {
      // In a real app, we would pass these query params. Currently the backend 
      // might just have `GET /shipments/order/:orderId` or we might need to add `GET /admin/shipments`.
      // Let's assume `GET /admin/shipments` exists or we pass params to `/shipments`.
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));
      if (params.provider) searchParams.set("provider", params.provider);
      if (params.status) searchParams.set("status", params.status);
      if (params.search) searchParams.set("search", params.search);
      
      const response = await apiClient.get(`/admin/shipments?${searchParams.toString()}`);
      return response.data;
    },
  });
}

export function useAdminShipmentById(id: string) {
  return useQuery({
    queryKey: ["admin", "shipments", id],
    queryFn: async () => {
      const response = await apiClient.get(`/admin/shipments/${id}`);
      return response.data.data as IShipment;
    },
    enabled: !!id,
  });
}
export function useShipmentRates() {
  return useMutation({
    mutationFn: async (data: { orderId: string, weightKg: number, length?: number, breadth?: number, height?: number, isCod?: boolean }) => {
      const response = await apiClient.post(`/shipments/rates`, {
        orderId: data.orderId,
        weightKg: data.weightKg,
        length: data.length,
        breadth: data.breadth,
        height: data.height,
        isCod: data.isCod
      });
      return response.data.data;
    },
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { orderId: string, provider: string, length?: number, breadth?: number, height?: number, weight?: number }) => {
      const response = await apiClient.post(`/shipments/admin`, data);
      return response.data.data as IShipment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipments", "order", data.orderId] });
    },
  });
}

export function useSyncTracking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await apiClient.post(`/shipments/admin/${shipmentId}/sync`);
      return response.data.data as IShipment;
    },
    onSuccess: (_, shipmentId) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
    },
  });
}

export function useRequestPickup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shipmentId: string) => {
      const response = await apiClient.post(`/shipments/admin/${shipmentId}/pickup`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
    },
  });
}
