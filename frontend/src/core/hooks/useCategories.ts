import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { ICategory } from "@store4riders/shared-types";
import { toast } from "sonner";

export interface ICategoryTree extends ICategory {
  children?: ICategoryTree[];
}

export function useCategoryTree() {
  return useQuery({
    queryKey: ["categoryTree"],
    queryFn: async () => {
      const response = await apiClient.get<{ success: boolean; data: ICategoryTree[] }>("/categories/tree");
      return response.data.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ICategory>) => {
      const response = await apiClient.post<{ success: boolean; data: ICategory }>("/admin/categories", data);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categoryTree"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create category");
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ICategory> }) => {
      const response = await apiClient.put<{ success: boolean; data: ICategory }>(`/admin/categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["categoryTree"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update category");
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categoryTree"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete category");
    },
  });
}
