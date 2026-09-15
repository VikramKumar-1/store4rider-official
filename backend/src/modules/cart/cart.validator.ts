import { NextRequest } from "next/server";
import { cartItemSchema } from "@store4riders/shared-validation";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * CartValidator
 * 
 * Extracts and validates payload data and user authentication context 
 * for shopping cart operations.
 */
export class CartValidator {
  
  /**
   * Extracts the authenticated user's ID for cart retrieval.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {string} The authenticated user's ID.
   */
  static extractUserId(req: NextRequest) {
    return extractUserFromAuth(req);
  }

  /**
   * Validates the payload for adding an item to the cart.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<{userId: string, data: any}>} The user ID and validated cart item.
   */
  static async validateAddItem(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = cartItemSchema.parse(body);
    return { userId, data };
  }
}
