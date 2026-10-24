import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IOrder } from "@store4riders/shared-types";
import { toast } from "sonner";

export interface IOrderCounts {
  activeCount: number;
  failedCount: number;
  exchangeCount: number;
  prepaidCount: number;
  codCount: number;
}

export function useAdminOrders(params: { page: number; limit: number; status?: string; paymentMethod?: string; search?: string }) {
  return useQuery({
    queryKey: ["admin-orders", params],
    queryFn: async () => {
      const response = await apiClient.get("/orders/admin", { params });
      return response.data.data; // { items: IOrder[], totalCount, page, limit }
    },
    placeholderData: (prev) => prev,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminOrderSuggest(query: string) {
  const clean = query.trim();
  return useQuery({
    queryKey: ["admin-orders-suggest", clean],
    queryFn: async () => {
      if (!clean || clean.length < 2) return [];
      const response = await apiClient.get("/orders/admin/suggest", {
        params: { q: clean },
      });
      return response.data?.data || [];
    },
    enabled: clean.length >= 2,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminOrderCounts() {
  return useQuery<IOrderCounts>({
    queryKey: ["admin-orders-counts"],
    queryFn: async () => {
      const response = await apiClient.get("/orders/admin/counts");
      return response.data.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiClient.put(`/orders/admin/${orderId}/status`, { status });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      toast.success("Order status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to update order status");
    }
  });
}

export function useAdminAddOrderNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, text }: { orderId: string; text: string }) => {
      const response = await apiClient.post(`/orders/admin/${orderId}/notes`, { text });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      toast.success("Note added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to add note");
    }
  });
}

export function useAdminHandleReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, action, adminNote }: { orderId: string; action: "approve" | "reject"; adminNote?: string }) => {
      const response = await apiClient.put(`/orders/admin/${orderId}/return`, { action, adminNote });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      toast.success(`Return ${variables.action}d successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || `Failed to process return`);
    }
  });
}

export function useAdminDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient.delete(`/orders/admin/${orderId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to delete order");
    }
  });
}

export function useAdminResendInvoiceEmail() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiClient.post(`/orders/admin/${orderId}/resend-invoice-email`);
      return response.data.data;
    },
    onSuccess: (data) => {
      toast.success(`Tax invoice emailed to ${data?.recipientEmail || "customer"}`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to send invoice email");
    }
  });
}

export function useAdminAssignWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, warehouseId }: { orderId: string; warehouseId: string }) => {
      const response = await apiClient.put(`/orders/admin/${orderId}/warehouse`, { warehouseId });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Dispatch warehouse updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to update warehouse");
    }
  });
}
