import { create } from "zustand";
import { ICartItem } from "@store4riders/shared-types";

export interface LocalCartItem extends ICartItem {
  product?: any;
}

interface CartState {
  items: LocalCartItem[];
  currentUserId: string | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (item: LocalCartItem) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string, itemId?: string) => void;
  clearCart: () => void;
  /** Switches active cart storage to the specified user or guest */
  switchUserCart: (userId: string | null) => void;
}

const getCartStorageKey = (userId: string | null) => {
  return userId ? `s4r_cart_user_${userId}` : `s4r_cart_guest`;
};

const loadItemsFromStorage = (userId: string | null): LocalCartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getCartStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load cart from storage", e);
  }
  return [];
};

const saveItemsToStorage = (userId: string | null, items: LocalCartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCartStorageKey(userId), JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save cart to storage", e);
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  currentUserId: null,
  isDrawerOpen: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),

  switchUserCart: (userId: string | null) => {
    const items = loadItemsFromStorage(userId);
    set({ currentUserId: userId, items });
  },

  addItem: (item) => {
    const { items, currentUserId } = get();
    const existingIndex = items.findIndex(
      (i) =>
        (i.id && item.id && i.id === item.id) ||
        (i.productId === item.productId && (i.variantId || "") === (item.variantId || ""))
    );

    let updated: LocalCartItem[];
    if (existingIndex > -1) {
      updated = items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      updated = [...items, item];
    }

    saveItemsToStorage(currentUserId, updated);
    set({ items: updated });
  },

  updateQuantity: (productId, quantity, variantId) => {
    const { items, currentUserId } = get();
    let updated: LocalCartItem[];

    if (quantity <= 0) {
      updated = items.filter(
        (i) => !(i.productId === productId && (i.variantId || "") === (variantId || ""))
      );
    } else {
      updated = items.map((i) =>
        i.productId === productId && (i.variantId || "") === (variantId || "")
          ? { ...i, quantity }
          : i
      );
    }

    saveItemsToStorage(currentUserId, updated);
    set({ items: updated });
  },

  removeItem: (productId, variantId, itemId) => {
    const { items, currentUserId } = get();
    const updated = items.filter((i) => {
      if (itemId && i.id === itemId) return false;
      if (i.id === productId) return false;
      if (i.productId === productId) {
        if (variantId !== undefined && i.variantId !== undefined) {
          return i.variantId !== variantId;
        }
        return false;
      }
      return true;
    });

    saveItemsToStorage(currentUserId, updated);
    set({ items: updated });
  },

  clearCart: () => {
    const { currentUserId } = get();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(getCartStorageKey(currentUserId));
        localStorage.removeItem("guest-cart-storage");
        localStorage.removeItem("s4r-user-cart-v2");
      } catch (e) {}
    }
    set({ items: [] });
  },
}));

// Initialize cart on client side
if (typeof window !== "undefined") {
  try {
    const authData = localStorage.getItem("auth-storage");
    let initialUserId: string | null = null;
    if (authData) {
      const parsed = JSON.parse(authData);
      initialUserId = parsed?.state?.user?.id || parsed?.state?.user?.email || null;
    }
    useCartStore.getState().switchUserCart(initialUserId);
  } catch (e) {}
}
