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
        try {
          const res = await apiClient.post("/cart/sync", {
            items: guestItems.map((i) => ({
              id: i.id,
              productId: i.productId,
              variantId: i.variantId || undefined,
              quantity: i.quantity,
              product: i.product,
            })),
          });
          const serverCart = res?.data?.data;
          if (serverCart && Array.isArray(serverCart.items)) {
            set({ items: serverCart.items });
            saveItemsToStorage(userId, serverCart.items);
            if (typeof window !== "undefined") {
              localStorage.removeItem(getCartStorageKey(null));
            }
          }
        } catch (err) {
          // If sync failed, fetch server cart as fallback
          try {
            const res = await apiClient.get("/cart");
            const serverCart = res?.data?.data;
            if (serverCart && Array.isArray(serverCart.items)) {
              set({ items: serverCart.items });
              saveItemsToStorage(userId, serverCart.items);
            }
          } catch (e) {}
        }
      } else {
        // Fetch user's canonical cloud cart from MongoDB
        try {
          const res = await apiClient.get("/cart");
          const serverCart = res?.data?.data;
          if (serverCart && Array.isArray(serverCart.items)) {
            set({ items: serverCart.items });
            saveItemsToStorage(userId, serverCart.items);
          }
        } catch (err) {
          // Keep cached items if offline
        }
      }
    });
  },

  addItem: (item) => {
    const { items, currentUserId } = get();
    const normVariantId = item.variantId || "";
    const existingIndex = items.findIndex(
      (i) =>
        (i.id && item.id && i.id === item.id) ||
        (i.productId === item.productId && (i.variantId || "") === normVariantId)
    );

    let updated: LocalCartItem[];
    if (existingIndex > -1) {
      updated = items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      updated = [...items, { ...item, id: item.id || crypto.randomUUID() }];
    }

    saveItemsToStorage(currentUserId, updated);
    set({ items: updated });

    if (currentUserId) {
      syncToServer(async (apiClient) => {
        const res = await apiClient.post("/cart/items", {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          product: item.product,
        });
        const serverCart = res?.data?.data;
        if (serverCart && Array.isArray(serverCart.items)) {
          set({ items: serverCart.items });
          saveItemsToStorage(currentUserId, serverCart.items);
        }
      });
    }
  },

  updateQuantity: (productId, quantity, variantId) => {
    const { items, currentUserId, removeItem } = get();
    if (quantity <= 0) {
      removeItem(productId, variantId);
      return;
    }
    const normVariantId = variantId || "";
    const updated = items.map((i) =>
      i.productId === productId && (i.variantId || "") === normVariantId
        ? { ...i, quantity }
        : i
    );

    saveItemsToStorage(currentUserId, updated);
    set({ items: updated });

    if (currentUserId) {
      syncToServer(async (apiClient) => {
        const payload: { productId: string; quantity: number; variantId?: string } = {
          productId,
          quantity,
        };
        if (variantId) payload.variantId = variantId;
        const res = await apiClient.put("/cart/items", payload);
        const serverCart = res?.data?.data;
        if (serverCart && Array.isArray(serverCart.items)) {
          set({ items: serverCart.items });
          saveItemsToStorage(currentUserId, serverCart.items);
        }
      });
    }
  },

  removeItem: (productId, variantId, itemId) => {
    const { items, currentUserId } = get();
    const normVariantId = variantId || "";

    const filterItem = (i: LocalCartItem) => {
      // 1. If itemId provided, match by item.id or MongoDB _id
      if (itemId) {
        if (i.id && String(i.id) === String(itemId)) return false;
        if ((i as any)._id && String((i as any)._id) === String(itemId)) return false;
      }
      // 2. Direct match on item.id or _id being productId
      if (i.id && String(i.id) === String(productId)) return false;
      if ((i as any)._id && String((i as any)._id) === String(productId)) return false;

      // 3. Match on productId
      if (i.productId === productId) {
        if (variantId !== undefined && variantId !== null && variantId !== "") {
          return (i.variantId || "") !== normVariantId;
        }
        return false;
      }
      return true;
    };

    const updated = items.filter(filterItem);

    // Save to current user's storage
    saveItemsToStorage(currentUserId, updated);

    // Scrub guest storage so guest storage can never restore this item!
    const guestItems = loadItemsFromStorage(null);
    if (guestItems.length > 0) {
      const updatedGuest = guestItems.filter(filterItem);
      saveItemsToStorage(null, updatedGuest);
    }

    set({ items: updated });

    if (currentUserId) {
      syncToServer(async (apiClient) => {
        const payload: { productId?: string; variantId?: string; itemId?: string } = {};
        if (productId) payload.productId = productId;
        if (variantId) payload.variantId = variantId;
        if (itemId) payload.itemId = itemId;

        const res = await apiClient.delete("/cart/items", { data: payload });
        const serverCart = res?.data?.data;
        if (serverCart && Array.isArray(serverCart.items)) {
          set({ items: serverCart.items });
          saveItemsToStorage(currentUserId, serverCart.items);
        }
      });
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
      syncToServer(async (apiClient) => {
        await apiClient.delete("/cart");
      });
    }
  },

  fetchServerCart: async () => {
    const { currentUserId } = get();
    if (!currentUserId) return;
    await syncToServer(async (apiClient) => {
      const res = await apiClient.get("/cart");
      const serverCart = res?.data?.data;
      if (serverCart && Array.isArray(serverCart.items)) {
        set({ items: serverCart.items });
        saveItemsToStorage(currentUserId, serverCart.items);
      }
    });
  },
}));
