import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

// Customer: Create a Return Request
export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post("/returns", data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific order so the UI updates to show the return status
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
}

// Admin: Get all returns for QC Dashboard
export function useAdminReturns(page = 1, limit = 20, status?: string) {
  return useQuery({
    queryKey: ["admin-returns", page, limit, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (status) params.append("status", status);
      
      const response = await apiClient.get(`/returns/admin?${params.toString()}`);
      return response.data.data; // { items, totalCount, page, limit }
    },
  });
}

// Admin: Inward Scan (Barcode)
export function useInwardScanQC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (returnId: string) => {
      const response = await apiClient.post(`/returns/admin/${returnId}/inward`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
  });
}

// Admin: Process QC Result (Approve/Reject)
export function useProcessQC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ returnId, action, qcNotes, deductionAmount }: { returnId: string, action: string, qcNotes?: string, deductionAmount?: number }) => {
      const response = await apiClient.post(`/returns/admin/${returnId}/qc`, { action, qcNotes, deductionAmount });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
    },
  });
}
