import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IContactIssue, IContactIssueStats } from "@store4riders/shared-types";
import { CreateContactIssueInput, UpdateContactIssueStatusInput } from "@store4riders/shared-validation";
import { toast } from "sonner";

export interface ContactIssueQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  search?: string;
}

export function useSubmitContactIssue() {
  return useMutation({
    mutationFn: async (data: CreateContactIssueInput) => {
      const response = await apiClient.post("/contact", data);
      return response.data; // { success: true, data: IContactIssue, message: string }
    },
    onSuccess: (res) => {
      toast.success(res.message || "Your support inquiry has been submitted!");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to submit support inquiry";
      toast.error(msg);
    },
  });
}

export function useAdminContactIssues(params: ContactIssueQueryParams) {
  return useQuery<{ items: IContactIssue[]; totalCount: number; page: number; limit: number; totalPages: number }>({
    queryKey: ["admin-contact-issues", params],
    queryFn: async () => {
      const response = await apiClient.get("/contact/admin", { params });
      return response.data.data;
    },
    placeholderData: (prev) => prev,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminContactStats() {
  return useQuery<IContactIssueStats>({
    queryKey: ["admin-contact-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/contact/admin/stats");
      return response.data.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useAdminUpdateContactStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactIssueStatusInput }) => {
      const response = await apiClient.put(`/contact/admin/${id}/status`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-issues"] });
      queryClient.invalidateQueries({ queryKey: ["admin-contact-stats"] });
      toast.success("Inquiry status updated successfully");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to update inquiry status";
      toast.error(msg);
    },
  });
}

export function useAdminAddContactNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const response = await apiClient.post(`/contact/admin/${id}/notes`, { text });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-issues"] });
      toast.success("Note added successfully");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Failed to add note";
      toast.error(msg);
    },
  });
}
