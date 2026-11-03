import axios from "axios";
import { useAuthStore } from "@/stores/useAuthStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add an interceptor for tokens from Zustand store
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Zustand persist stores data in localStorage, but we can access it directly via getState()
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Mutex / Queue state for concurrent 401 token refreshes (prevents Thundering Herd race condition)
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Auto-refresh token interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Never attempt token refresh on login/register/refresh endpoints or if request config missing
    if (!originalRequest) return Promise.reject(error);

    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    // Only attempt refresh on 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const { isAuthenticated, refreshToken } = useAuthStore.getState();

      // If user was never authenticated, reject immediately without touching refresh or redirect
      if (!isAuthenticated) {
        return Promise.reject(error);
      }

      // If a refresh is ALREADY in-flight, queue this request to wait for the ongoing refresh
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh token endpoint (sends both cookie and body token for bulletproof cross-origin support)
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: refreshToken || undefined },
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;

        if (newAccessToken) {
          // Update the zustand store with the refreshed access token
          useAuthStore.getState().setToken(newAccessToken, newRefreshToken);
          processQueue(null, newAccessToken);

          // Retry the original request with the new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } else {
          throw new Error("No access token returned from refresh endpoint");
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        // Only log out if it's explicitly an auth error (400-499). Don't log out on 500s or Network Errors
        if (refreshError.response?.status >= 400 && refreshError.response?.status < 500) {
          useAuthStore.getState().logout();

          // Silently trigger server-side cookie clearance
          axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});

          // ROUTE-AWARE REDIRECT:
          // NEVER kick a browsing customer out of public storefront pages (Home, Category, PDP, Cart) to /login.
          // Demote to guest silently so browsing continues smoothly.
          // ONLY redirect if actively on private account or admin management routes.
          if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            const isProtectedRoute =
              pathname.startsWith("/account") ||
              pathname.startsWith("/admin");

            if (isProtectedRoute) {
              window.location.href = `/login?expired=true&redirect=${encodeURIComponent(pathname)}`;
            }
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
