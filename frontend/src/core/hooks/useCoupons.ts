import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { ICoupon, ICouponValidationResult } from "@store4riders/shared-types";
import { toast } from "sonner";

export interface CouponListParams {
  search?: string;
  status?: string;
  scope?: string;
  page?: number;
  limit?: number;
}

export interface CouponListResponse {
  items: ICoupon[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useCoupons(params: CouponListParams = {}) {
  const { search = "", status = "all", scope = "all_scopes", page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ["admin-coupons", { search, status, scope, page, limit }],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (status && status !== "all") query.set("status", status);
      if (scope && scope !== "all_scopes") query.set("scope", scope);
      query.set("page", String(page));
      query.set("limit", String(limit));

      const response = await apiClient.get(`/coupons?${query.toString()}`);
      return response.data.data as CouponListResponse;
    },
  });
}

export function useCoupon(id: string) {
  return useQuery({
    queryKey: ["admin-coupon", id],
    queryFn: async () => {
      const response = await apiClient.get(`/coupons/${id}`);
      return response.data.data as ICoupon;
    },
    enabled: Boolean(id),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ICoupon>) => {
      const response = await apiClient.post("/coupons", data);
      return response.data.data as ICoupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon created successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create coupon");
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ICoupon> }) => {
      const response = await apiClient.put(`/coupons/${id}`, data);
      return response.data.data as ICoupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update coupon");
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/coupons/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete coupon");
    },
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (payload: {
      code: string;
      items?: Array<{ productId: string; variantId?: string | null; quantity: number }>;
      cartTotal?: number;
    }) => {
      const response = await apiClient.post("/coupons/validate", payload);
      return response.data.data as ICouponValidationResult;
    },
  });
}
