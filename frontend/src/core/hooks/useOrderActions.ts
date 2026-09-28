import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { toast } from "sonner";

export function useRequestReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason, images }: { orderId: string; reason: string; images?: string[] }) => {
      const response = await apiClient.post(`/orders/${orderId}/return`, { reason, images });
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      toast.success("Return request submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to submit return request");
    }
  });
}

export function useGenerateInvoice() {
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Send admin=true just in case this is called from admin panel. API ignores it if not admin.
      const response = await apiClient.get(`/orders/${orderId}/invoice?admin=true`);
      return response.data.data.invoiceUrl as string;
    },
    onSuccess: (url) => {
      if (url) {
        window.open(url, "_blank");
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to generate invoice");
    }
  });
}
