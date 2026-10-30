import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchModalOpen: boolean;
  isBottomModalOpen: boolean;
  theme: "light" | "dark";
  homepageReviewIds: string[];
  isPDP: boolean;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  toggleSearchModal: () => void;
  setIsBottomModalOpen: (isOpen: boolean) => void;
  setIsPDP: (isPDP: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
  setHomepageReviewIds: (ids: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isMobileMenuOpen: false,
  isSearchModalOpen: false,
  isBottomModalOpen: false,
  theme: "light",
  homepageReviewIds: [],
  isPDP: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  toggleSearchModal: () => set((state) => ({ isSearchModalOpen: !state.isSearchModalOpen })),
  setIsBottomModalOpen: (isOpen: boolean) => set({ isBottomModalOpen: isOpen }),
  setIsPDP: (isPDP: boolean) => set({ isPDP }),
  setTheme: (theme) => set({ theme }),
  setHomepageReviewIds: (ids) => set({ homepageReviewIds: ids }),
}));
