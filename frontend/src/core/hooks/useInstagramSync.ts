import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { IHomepageConfig } from "@store4riders/shared-types";
import { toast } from "sonner";

export function useSyncInstagramFeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: { accessToken?: string; accountId?: string }) => {
      const res = await apiClient.post<{ success: boolean; data: IHomepageConfig }>(
        "/homepage/sync-instagram",
        payload || {}
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      const count = data?.sections?.socialMedia?.reels?.length || 0;
      toast.success(`Successfully synced ${count} Instagram reels & live profile stats!`);
    },
    onError: (err: any) => {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to sync Instagram feed";
      toast.error(errorMessage);
    },
  });
}
