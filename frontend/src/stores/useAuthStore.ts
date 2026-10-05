import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCartStore } from "./useCartStore";
import { IUserAddress } from "@store4riders/shared-types";

interface User {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string;
  addresses?: IUserAddress[];
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setToken: (token: string, refreshToken?: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, token, refreshToken) => {
        const userId = user.id || user.email;
        useCartStore.getState().switchUserCart(userId);
        set({ user, token, refreshToken: refreshToken || null, isAuthenticated: true });
      },
      setToken: (token, refreshToken) => {
        set((s) => ({ token, ...(refreshToken ? { refreshToken } : {}) }));
      },
      setUser: (user) => {
        if (user) {
          useCartStore.getState().switchUserCart(user.id || user.email);
        }
        set({ user, isAuthenticated: !!user });
      },
      logout: () => {
        useCartStore.getState().switchUserCart(null);
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage", // stores auth state in localStorage
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
        // SECURITY: NEVER persist `token` or `refreshToken` to localStorage to prevent XSS!
        // The browser uses secure HttpOnly cookies for ongoing authentication.
      }),
    }
  )
);
