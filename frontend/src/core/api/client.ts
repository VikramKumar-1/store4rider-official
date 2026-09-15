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
