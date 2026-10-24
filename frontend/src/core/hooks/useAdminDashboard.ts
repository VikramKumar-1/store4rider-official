import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useAdminStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/stats");
      return response.data.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 30000, // 30s client memory freshness for instant snappiness
    refetchOnWindowFocus: false, // Prevents window refocus DB thrashing
  });
}

export function useAdminRecentOrders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/recent-orders");
      return response.data.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 15000,
    refetchOnWindowFocus: false,
  });
}

export function useAdminRevenueChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "revenue-chart"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/revenue-chart");
      return response.data.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : true,
    staleTime: 60000, // 1 min client cache
    refetchOnWindowFocus: false,
  });
}

export interface ILogisticsOrderItem {
  name: string;
  sku: string;
  quantity: number;
  image?: string;
}

export interface ILogisticsOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
    addressLine1?: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  paymentMethod: string;
  codAmountToCollect?: number;
  totalAmount?: number;
  pricing?: {
    subtotal?: number;
    discount?: number;
    shipping?: number;
    tax?: number;
    total?: number;
    codAmountToCollect?: number;
  };
  orderStatus: string;
  fulfillmentStatus: "NEW" | "PACKED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "ISSUE";
  slaBreached: boolean;
  itemsCount: number;
  items: ILogisticsOrderItem[];
  shipment: {
    id?: string;
    awb?: string;
    provider?: string;
    courierName?: string;
    status?: string;
    trackingUrl?: string;
    labelUrl?: string;
    pickupScheduledDate?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export interface ILogisticsStatsData {
  last24Summary: {
    totalOrders: number;
    newOrders: number;
    packedOrders: number;
    inTransit: number;
    outForDelivery: number;
    delivered: number;
    issues: number;
    slaBreached: number;
    paymentSplit: {
      cod: number;
      prepaid: number;
    };
    carrierBreakdown: Record<string, number>;
  };
  overallPipeline: {
    pendingPacking: number;
    packedReadyForPickup: number;
    inTransit: number;
    outForDelivery: number;
    deliveredToday: number;
    exceptions: number;
  };
  pagination: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  orders: ILogisticsOrder[];
  recentOrders?: ILogisticsOrder[];
}

export interface GetLogisticsStatsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useAdminLogisticsStats(params: GetLogisticsStatsParams = {}) {
  const { page = 1, limit = 10, status = "ALL", search = "" } = params;

  return useQuery<ILogisticsStatsData>({
    queryKey: ["admin", "logistics-stats", { page, limit, status, search }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (page) searchParams.set("page", String(page));
      if (limit) searchParams.set("limit", String(limit));
      if (status && status !== "ALL") searchParams.set("status", status);
      if (search) searchParams.set("search", search);

      const response = await apiClient.get(`/admin/dashboard/logistics-stats?${searchParams.toString()}`);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData, // Keeps previous page active while fetching next page - stops UI bounce!
    staleTime: 60000, // 60s fresh cache prevents redundant database queries
    refetchOnWindowFocus: false, // Prevents sudden loading jumps when switching browser tabs
    refetchInterval: false, // Auto-refresh disabled: protects database from heavy continuous polling at scale
  });
}
