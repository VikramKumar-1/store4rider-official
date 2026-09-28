import { create } from "zustand";
import { ICartItem } from "@store4riders/shared-types";

export interface LocalCartItem extends ICartItem {
  product?: any;
}

interface CartState {
  items: LocalCartItem[];
  isLoaded: boolean;
  currentUserId: string | null;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addItem: (item: LocalCartItem) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string, itemId?: string) => void;
  clearCart: () => void;
  /** Switches active cart storage to the specified user or guest and syncs with cloud */
  switchUserCart: (userId: string | null) => void;
  /** Fetches latest cloud cart from server */
  fetchServerCart: () => Promise<void>;
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

/**
 * Helper to dynamically load apiClient without creating circular import dependencies
 */
const syncToServer = async (action: (client: any) => Promise<any>) => {
  if (typeof window === "undefined") return;
  try {
    const { apiClient } = await import("@/core/api/client");
    return await action(apiClient);
  } catch (e) {
    // Non-blocking catch to guarantee client resilience
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoaded: false,
  currentUserId: null,
  isDrawerOpen: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),

  switchUserCart: (userId: string | null) => {
    if (userId === null) {
      // Guest mode
      const items = loadItemsFromStorage(null);
      set({ currentUserId: null, items, isLoaded: true });
      return;
    }

    // Optimistically load cached items for instantaneous UI display
    const cachedItems = loadItemsFromStorage(userId);
    set({ currentUserId: userId, items: cachedItems, isLoaded: true });

    // Check if guest items need merging into user's account
    const guestItems = loadItemsFromStorage(null);

    syncToServer(async (apiClient) => {
      if (guestItems && guestItems.length > 0) {
        // Merge guest items with cloud cart
        const res = await apiClient.post("/cart/sync", {
          items: guestItems.map((i) => ({
            id: i.id,
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            product: i.product,
          })),
        });
        const serverCart = res.data?.data;
        if (serverCart && Array.isArray(serverCart.items)) {
          set({ items: serverCart.items });
          saveItemsToStorage(userId, serverCart.items);
          if (typeof window !== "undefined") {
            localStorage.removeItem(getCartStorageKey(null));
          }
        }
      } else {
        // Fetch user's existing cloud cart from MongoDB
        const res = await apiClient.get("/cart");
        const serverCart = res.data?.data;
        if (serverCart && Array.isArray(serverCart.items)) {
          if (serverCart.items.length > 0 || cachedItems.length === 0) {
            set({ items: serverCart.items });
            saveItemsToStorage(userId, serverCart.items);
          } else if (cachedItems.length > 0) {
            // Push local cached items to cloud if cloud was empty
            const syncRes = await apiClient.post("/cart/sync", {
              items: cachedItems.map((i) => ({
                id: i.id,
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
                product: i.product,
              })),
            });
            const updated = syncRes.data?.data;
            if (updated && Array.isArray(updated.items)) {
              set({ items: updated.items });
              saveItemsToStorage(userId, updated.items);
            }
          }
        }
      }
    });
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

    if (currentUserId) {
      syncToServer((apiClient) =>
        apiClient.post("/cart/items", {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          product: item.product,
        })
      );
    }
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

    if (currentUserId) {
      syncToServer((apiClient) =>
        apiClient.put("/cart/items", {
          productId,
          variantId,
          quantity,
        })
      );
    }
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

    if (currentUserId) {
      syncToServer((apiClient) =>
        apiClient.delete("/cart/items", {
          data: { productId, variantId, itemId },
        })
      );
    }
  },

  clearCart: () => {
    const { currentUserId } = get();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(getCartStorageKey(currentUserId));
        localStorage.removeItem(getCartStorageKey(null));
        localStorage.removeItem("guest-cart-storage");
        localStorage.removeItem("s4r-user-cart-v2");
      } catch (e) {}
    }
    set({ items: [] });

    if (currentUserId) {
      syncToServer((apiClient) => apiClient.delete("/cart"));
    }
  },

  fetchServerCart: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    await syncToServer(async (apiClient) => {
      const res = await apiClient.get("/cart");
      const serverCart = res.data?.data;
      if (serverCart && Array.isArray(serverCart.items)) {
        set({ items: serverCart.items });
        saveItemsToStorage(currentUserId, serverCart.items);
      }
    });
  },
}));
