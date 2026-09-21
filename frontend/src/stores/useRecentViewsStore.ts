import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CatalogProduct } from "@/modules/catalog/types/catalog.types";

interface RecentViewsState {
  items: CatalogProduct[];
  addRecentView: (product: CatalogProduct) => void;
  clearHistory: () => void;
}

export const useRecentViewsStore = create<RecentViewsState>()(
  persist(
    (set) => ({
      items: [],
      addRecentView: (product) => set((state) => {
        // Remove if it already exists to move it to the front
        const filtered = state.items.filter((item) => item.id !== product.id);
        // Add to front, keep only last 10
        return { items: [product, ...filtered].slice(0, 10) };
      }),
      clearHistory: () => set({ items: [] }),
    }),
    { name: "recent-views-storage" }
  )
);
