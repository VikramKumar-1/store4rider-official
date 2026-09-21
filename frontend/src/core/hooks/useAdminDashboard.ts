import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/stats");
      return response.data.data;
    },
  });
}

export function useAdminRecentOrders() {
  return useQuery({
    queryKey: ["admin", "recent-orders"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/recent-orders");
      return response.data.data;
    },
  });
}

export function useAdminRevenueChart() {
  return useQuery({
    queryKey: ["admin", "revenue-chart"],
    queryFn: async () => {
      const response = await apiClient.get("/admin/dashboard/revenue-chart");
      return response.data.data;
    },
  });
}
