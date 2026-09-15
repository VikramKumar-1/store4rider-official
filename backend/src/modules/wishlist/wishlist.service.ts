import { WishlistRepository } from "./wishlist.repository";
import { IWishlist } from "@store4riders/shared-types";

/**
 * @class WishlistService
 * @description Core business logic for User Wishlists.
 * Highlights:
 * - Upserts empty wishlists for new users.
 * - Toggles products (adds if missing, removes if present) automatically.
 */
export class WishlistService {
  
  static async getWishlist(userId: string): Promise<IWishlist> {
    const wishlist = await WishlistRepository.findByUserId(userId);
    if (!wishlist) {
      return await WishlistRepository.upsert(userId, []);
    }
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
    
    return await WishlistRepository.upsert(userId, wishlist.productIds);
  }
}
