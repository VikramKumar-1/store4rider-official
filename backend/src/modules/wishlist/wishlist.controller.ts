import { NextRequest } from "next/server";
import { WishlistService } from "./wishlist.service";
import { WishlistValidator } from "./wishlist.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class WishlistController
 * @description Minimal HTTP controller for User Wishlists.
 * Responsibilities:
 * 1. Extract payloads via WishlistValidator.
 * 2. Delegate to WishlistService.
 * 3. Return standardized API responses.
 */
export class WishlistController {
  
  static async get(req: NextRequest) {
    const userId = WishlistValidator.extractUserId(req);
    const wishlist = await WishlistService.getWishlist(userId);
    return ApiResponse.success(wishlist, "Wishlist fetched successfully");
  }

  static async toggle(req: NextRequest) {
    const { userId, productId } = await WishlistValidator.validateToggle(req);
    const wishlist = await WishlistService.toggleProduct(userId, productId);
    return ApiResponse.success(wishlist, "Wishlist updated successfully");
  }
}
