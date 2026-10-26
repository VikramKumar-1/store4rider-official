import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IBlogPost, IBlogCategory, IBlogPostQuery } from "@store4riders/shared-types";
import { toast } from "sonner";

export interface PaginatedBlogResponse {
  items: IBlogPost[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== PUBLIC HOOKS =====================

export function usePublicBlogPosts(params: IBlogPostQuery = {}) {
  return useQuery({
    queryKey: ["blog-posts", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.page) query.set("page", params.page.toString());
      if (params.limit) query.set("limit", params.limit.toString());
      if (params.categorySlug) query.set("categorySlug", params.categorySlug);
      if (params.search) query.set("search", params.search);
      if (params.tag) query.set("tag", params.tag);
      if (params.sortBy) query.set("sortBy", params.sortBy);
      if (params.sortOrder) query.set("sortOrder", params.sortOrder);

      const response = await apiClient.get(`/blog/posts?${query.toString()}`);
      return response.data.data as PaginatedBlogResponse;
    },
  });
}

export function usePublicBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/blog/posts/${slug}`);
      return response.data.data as IBlogPost;
    },
    enabled: !!slug,
  });
}

export function usePublicBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const response = await apiClient.get("/blog/categories");
      return response.data.data as IBlogCategory[];
    },
  });
}

// ===================== ADMIN HOOKS =====================

export function useAdminBlogPosts(params: IBlogPostQuery = {}) {
  return useQuery({
    queryKey: ["admin-blog-posts", params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params.page) query.set("page", params.page.toString());
      if (params.limit) query.set("limit", params.limit.toString());
      if (params.status) query.set("status", params.status);
      if (params.categorySlug) query.set("categorySlug", params.categorySlug);
      if (params.search) query.set("search", params.search);
      if (params.sortBy) query.set("sortBy", params.sortBy);
      if (params.sortOrder) query.set("sortOrder", params.sortOrder);

      const response = await apiClient.get(`/blog/admin/posts?${query.toString()}`);
      return response.data.data as PaginatedBlogResponse;
    },
  });
}

export function useAdminBlogPost(id: string) {
  return useQuery({
    queryKey: ["admin-blog-post", id],
    queryFn: async () => {
      const response = await apiClient.get(`/blog/admin/posts/${id}`);
      return response.data.data as IBlogPost;
    },
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IBlogPost>) => {
      const response = await apiClient.post("/blog/admin/posts", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create blog post");
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IBlogPost> }) => {
      const response = await apiClient.put(`/blog/admin/posts/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-post", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update blog post");
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/blog/admin/posts/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast.success("Blog post deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete blog post");
    },
  });
}

export function useAdminBlogCategories() {
  return useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const response = await apiClient.get("/blog/admin/categories");
      return response.data.data as IBlogCategory[];
    },
  });
}

export function useCreateBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<IBlogCategory>) => {
      const response = await apiClient.post("/blog/admin/categories", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category created successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create category");
    },
  });
}

export function useUpdateBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IBlogCategory> }) => {
      const response = await apiClient.put(`/blog/admin/categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update category");
    },
  });
}

export function useDeleteBlogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/blog/admin/categories/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Category deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to delete category");
    },
  });
}

export function useSeedBlogContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { categories: any[]; posts: any[] }) => {
      const response = await apiClient.post("/blog/admin/seed", data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-categories"] });
      toast.success(`Seeded ${data.postsSeeded} articles and ${data.categoriesSeeded} categories!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to seed content");
    },
  });
}
