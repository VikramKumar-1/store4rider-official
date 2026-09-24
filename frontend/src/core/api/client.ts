import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

import { useAuthStore } from "@/stores/useAuthStore";

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

// Auto-refresh token interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized, and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint (which uses the HttpOnly refresh token cookie)
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        const newAccessToken = refreshResponse.data?.data?.accessToken;
        
        if (newAccessToken) {
          // Update the zustand store with the new access token
          useAuthStore.getState().setToken(newAccessToken);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails (e.g. refresh token expired too), logout user
        useAuthStore.getState().logout();
        // Redirect to login page
        if (typeof window !== "undefined") {
          window.location.href = "/login?expired=true";
        }
      }
    }
    
    return Promise.reject(error);
  }
);
