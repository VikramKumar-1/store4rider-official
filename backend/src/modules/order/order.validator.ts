import { NextRequest } from "next/server";
import { createOrderSchema, verifyPaymentSchema } from "@store4riders/shared-validation";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * OrderValidator
 * 
 * Handles extracting JSON payloads from incoming order requests
 * and strictly validating them against Zod schemas.
 */
export class OrderValidator {
  
  /**
   * Validates the payload for creating a new order.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<{userId: string, data: any}>} The user ID and validated order data.
   */
  static async validateCreate(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = createOrderSchema.parse(body);
    return { userId, data };
  }

  /**
   * Validates the payload for verifying a gateway payment.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<{userId: string, data: any}>} The user ID and validated payment data.
   */
  static async validateVerify(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = verifyPaymentSchema.parse(body);
    return { userId, data };
  }

  /**
   * Extracts the authenticated user's ID.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {string} The authenticated user's ID.
   */
  static extractUserId(req: NextRequest) {
    return extractUserFromAuth(req);
  }
}
