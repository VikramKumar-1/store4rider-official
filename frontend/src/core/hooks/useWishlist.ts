import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/core/api/client";

export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist_ids"],
    queryFn: async () => {
      const res = await apiClient.get("/wishlist/me");
      return (res.data.data?.productIds || []) as string[];
    },
    // Don't retry if the user is not logged in (401)
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await apiClient.post("/wishlist/toggle", { productId });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist_ids"] });
      // Also invalidate the full wishlist query if it exists
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
