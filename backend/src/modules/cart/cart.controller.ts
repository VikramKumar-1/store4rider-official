import { NextRequest } from "next/server";
import { CartService } from "./cart.service";
import { CartValidator } from "./cart.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class CartController
 * @description Minimal HTTP controller for Shopping Cart.
 * Responsibilities:
 * 1. Extract user info and payloads via CartValidator.
 * 2. Delegate to CartService.
 * 3. Return standardized API responses.
 */
export class CartController {
  
  static async get(req: NextRequest) {
    const userId = CartValidator.extractUserId(req);
    const cart = await CartService.getCart(userId);
    return ApiResponse.success(cart, "Cart fetched successfully");
  }

  static async addItem(req: NextRequest) {
    const { userId, data } = await CartValidator.validateAddItem(req);
    const cart = await CartService.addItem(userId, data as any);
    return ApiResponse.success(cart, "Item added to cart");
  }

  static async updateQuantity(req: NextRequest) {
    const { userId, data } = await CartValidator.validateUpdateQuantity(req);
    const cart = await CartService.updateQuantity(userId, data.productId, data.quantity, data.variantId);
    return ApiResponse.success(cart, "Cart item updated successfully");
  }

  static async removeItem(req: NextRequest) {
    const { userId, data } = await CartValidator.validateRemoveItem(req);
    const cart = await CartService.removeItem(userId, data.productId, data.variantId, data.itemId);
    return ApiResponse.success(cart, "Cart item removed successfully");
  }

  static async syncCart(req: NextRequest) {
    const { userId, data } = await CartValidator.validateSyncCart(req);
    const cart = await CartService.syncCart(userId, data.items as any);
    return ApiResponse.success(cart, "Cart synchronized successfully");
  }

  static async clearCart(req: NextRequest) {
    const userId = CartValidator.extractUserId(req);
    await CartService.clearCart(userId);
    return ApiResponse.success(null, "Cart cleared successfully");
  }
}
