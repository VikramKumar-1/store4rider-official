import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { IUserAddress } from "@store4riders/shared-types";

export function useUserAddresses() {
  const { isAuthenticated, setUser } = useAuthStore();

  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await apiClient.get("/users/me");
      const user = response.data.data;
      setUser(user);
      return (user.addresses || []) as IUserAddress[];
    },
    enabled: isAuthenticated,
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();
  const { setUser, isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async (addressData: { street: string; city: string; state: string; pincode: string; country: string; isDefault?: boolean }) => {
      if (!isAuthenticated) throw new Error("You must be logged in to add an address");
      const response = await apiClient.post("/users/me/addresses", addressData);
      return response.data.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      setUser(updatedUser);
    }
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const { setUser, isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async ({ addressId, addressData }: { addressId: string; addressData: Partial<IUserAddress> }) => {
      if (!isAuthenticated) throw new Error("You must be logged in to update an address");
      const response = await apiClient.put(`/users/me/addresses/${addressId}`, addressData);
      return response.data.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      setUser(updatedUser);
    }
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const { setUser, isAuthenticated } = useAuthStore();

  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!isAuthenticated) throw new Error("You must be logged in to delete an address");
      const response = await apiClient.delete(`/users/me/addresses/${addressId}`);
      return response.data.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      setUser(updatedUser);
    }
  });
}
