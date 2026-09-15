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
}
