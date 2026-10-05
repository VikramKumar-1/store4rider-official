import { WishlistRepository } from "./wishlist.repository";
import { IWishlist } from "@store4riders/shared-types";
import { getCache, setCache } from "../../core/cache/redis";

/**
 * @class WishlistService
 * @description Core business logic for User Wishlists.
 * Highlights:
 * - Upserts empty wishlists for new users.
 * - Toggles products (adds if missing, removes if present) automatically.
 * - Optimized with Redis caching to avoid heavy DB loads.
 */
export class WishlistService {
  
  static async getWishlist(userId: string): Promise<IWishlist> {
    const cacheKey = `wishlist_${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached as IWishlist;

    let wishlist = await WishlistRepository.findByUserId(userId);
    if (!wishlist) {
      wishlist = await WishlistRepository.upsert(userId, []);
    }

    await setCache(cacheKey, wishlist, 3600); // 1 hour TTL
    return wishlist;
  }

  static async toggleProduct(userId: string, productId: string): Promise<IWishlist> {
    const wishlist = await this.getWishlist(userId);
    const index = wishlist.productIds.indexOf(productId);
    
    if (index > -1) {
      wishlist.productIds.splice(index, 1);
    } else {
      wishlist.productIds.push(productId);
    }
    
    const updated = await WishlistRepository.upsert(userId, wishlist.productIds);
    
    // Update cache instantly to prevent DB load on next fetch
    await setCache(`wishlist_${userId}`, updated, 3600);
    
    return updated;
  }
}
