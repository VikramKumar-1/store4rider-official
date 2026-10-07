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
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
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

export function useRegister(options?: { disableRedirect?: boolean }) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.user && data?.data?.accessToken) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      }

      if (!options?.disableRedirect) {
        const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        const redirectTarget = searchParams?.get("redirect") || "/";

        toast.success("Account created successfully!");
        router.push(redirectTarget);
      } else {
        toast.success("Account created successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Registration failed");
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiClient.post("/auth/forgot-password", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("If an account exists, a password reset link has been sent.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to request password reset");
    },
  });
}

export function useResetPassword() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await apiClient.post("/auth/reset-password", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password reset successfully. You can now log in.");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reset password. Link may be expired.");
    },
  });
}
