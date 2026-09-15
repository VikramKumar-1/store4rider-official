import { NextRequest } from "next/server";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { AppError } from "../../core/errors/AppError";

/**
 * @class WishlistValidator
 * @description Extracts and validates user context and payloads for Wishlist operations.
 */
export class WishlistValidator {
  
  static extractUserId(req: NextRequest) {
    return extractUserFromAuth(req);
  }

  static async validateToggle(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const { productId } = body;

    if (!productId || typeof productId !== "string") {
      throw new AppError("Valid productId is required", 400);
    }

    return { userId, productId };
  }
}
