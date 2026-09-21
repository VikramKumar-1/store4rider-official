import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCartStore } from "@/stores/useCartStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function useLogin(options?: { disableRedirect?: boolean }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: any) => {
      const response = await apiClient.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.user && data?.data?.accessToken) {
        setAuth(data.data.user, data.data.accessToken);
      }
      toast.success("Successfully logged in!");
      
      if (!options?.disableRedirect) {
        const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const redirectTarget = searchParams?.get("redirect") || "/";
        router.push(redirectTarget);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Invalid email or password");
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.user && data?.data?.accessToken) {
        setAuth(data.data.user, data.data.accessToken);
      }

      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const redirectTarget = searchParams?.get("redirect") || "/";

      // If user registered normally from homepage (not during checkout), start with clean fresh cart
      if (redirectTarget !== "/checkout") {
        useCartStore.getState().clearCart();
      }

      toast.success("Account created successfully!");
      router.push(redirectTarget);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Registration failed");
    },
  });
}
