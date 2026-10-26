import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useCategoryTree,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../useCategories";
import { apiClient } from "../../api/client";
import { toast } from "sonner";

vi.mock("../../api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useCategories Hook Suite — Admin Panel Persistence", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCategoryTree", () => {
    it("fetches category tree from /categories/tree", async () => {
      const mockTree = [
        { _id: "cat_1", name: "Helmets", slug: "helmets", children: [] },
      ];
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockTree },
      });

      const { result } = renderHook(() => useCategoryTree(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockTree);
      expect(apiClient.get).toHaveBeenCalledWith("/categories/tree");
    });
  });

  describe("useCreateCategory (Admin)", () => {
    it("posts new category data to /admin/categories and invalidates tree cache", async () => {
      const newCategory = {
        name: "Full Face Helmets",
        slug: "full-face-helmets",
        description: "<h3>ECE 22.06 Approved</h3>",
      };
      const createdResponse = { _id: "new_id_123", ...newCategory };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { success: true, data: createdResponse },
      });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateCategory(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync(newCategory as any);
      });

      expect(apiClient.post).toHaveBeenCalledWith("/admin/categories", newCategory);
      expect(toast.success).toHaveBeenCalledWith("Category created successfully");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categoryTree"] });
    });
  });

  describe("useUpdateCategory (Admin)", () => {
    it("sends PUT request to /admin/categories/:id with rich description, faqs, and metadata", async () => {
      const updateData = {
        name: "Full Face Helmets — Updated",
        description: "<p>Updated rich description</p>",
        faqs: [{ question: "Is it safe?", answer: "Yes, 5 star rating." }],
        metaTitle: "Updated SEO Title",
      };
      const updatedResponse = { _id: "cat_001", ...updateData };

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: { success: true, data: updatedResponse },
      });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateCategory(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ id: "cat_001", data: updateData as any });
      });

      expect(apiClient.put).toHaveBeenCalledWith("/admin/categories/cat_001", updateData);
      expect(toast.success).toHaveBeenCalledWith("Category updated successfully");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categoryTree"] });
    });

    it("handles update failure with error toast message", async () => {
      const errorMsg = "Cannot set a descendant category as parent";
      vi.mocked(apiClient.put).mockRejectedValueOnce({
        response: { data: { error: errorMsg } },
      });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateCategory(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: "cat_001",
            data: { parentId: "sub_grandchild" } as any,
          });
        } catch {
          // Expected error rejection
        }
      });

      expect(toast.error).toHaveBeenCalledWith(errorMsg);
    });
  });

  describe("useDeleteCategory (Admin)", () => {
    it("sends DELETE request to /admin/categories/:id and invalidates tree cache", async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        data: { success: true },
      });

      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteCategory(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync("cat_to_delete");
      });

      expect(apiClient.delete).toHaveBeenCalledWith("/admin/categories/cat_to_delete");
      expect(toast.success).toHaveBeenCalledWith("Category deleted successfully");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["categoryTree"] });
    });
  });
});
