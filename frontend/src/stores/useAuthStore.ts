import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCartStore } from "./useCartStore";

interface User {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        const userId = user.id || user.email;
        useCartStore.getState().switchUserCart(userId);
        set({ user, token, isAuthenticated: true });
      },
      setUser: (user) => {
        if (user) {
          useCartStore.getState().switchUserCart(user.id || user.email);
        }
        set({ user, isAuthenticated: !!user });
      },
      logout: () => {
        useCartStore.getState().switchUserCart(null);
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage", // stores auth state in localStorage
    }
  )
);
