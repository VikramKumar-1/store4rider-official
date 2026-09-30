import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchModalOpen: boolean;
  isBottomModalOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  toggleSearchModal: () => void;
  setIsBottomModalOpen: (isOpen: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isMobileMenuOpen: false,
  isSearchModalOpen: false,
  isBottomModalOpen: false,
  theme: "light",
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  toggleSearchModal: () => set((state) => ({ isSearchModalOpen: !state.isSearchModalOpen })),
  setIsBottomModalOpen: (isOpen: boolean) => set({ isBottomModalOpen: isOpen }),
  setTheme: (theme) => set({ theme }),
}));
