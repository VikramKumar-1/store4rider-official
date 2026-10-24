import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useAdminUsers(page: number, limit: number, role?: string, search?: string) {
  return useQuery({
    queryKey: ["admin", "users", page, limit, role, search],
    queryFn: async () => {
      const response = await apiClient.get("/admin/users", { params: { page, limit, role, search } });
      return response.data.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 10000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueriesData({ queryKey: ["admin", "users"] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.items)) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((user: any) => {
            const uid = user.id || user._id;
            if (String(uid) === String(variables.userId)) {
              return { ...user, role: variables.role };
            }
            return user;
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"], refetchType: "all" });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiClient.put(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueriesData({ queryKey: ["admin", "users"] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.items)) return oldData;
        return {
          ...oldData,
          items: oldData.items.map((user: any) => {
            const uid = user.id || user._id;
            if (String(uid) === String(variables.userId)) {
              return { ...user, isActive: variables.isActive };
            }
            return user;
          }),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"], refetchType: "all" });
    },
  });
}

export function useCreateStaffUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      firstName: string;
      lastName?: string;
      phone?: string;
      role: string;
    }) => {
      const response = await apiClient.post("/admin/users", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"], refetchType: "all" });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: (_data, userId) => {
      queryClient.setQueriesData({ queryKey: ["admin", "users"] }, (oldData: any) => {
        if (!oldData || !Array.isArray(oldData.items)) return oldData;
        return {
          ...oldData,
          items: oldData.items.filter((user: any) => {
            const uid = user.id || user._id;
            return String(uid) !== String(userId);
          }),
          totalCount: Math.max(0, (oldData.totalCount || 1) - 1),
        };
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"], refetchType: "all" });
    },
  });
}
