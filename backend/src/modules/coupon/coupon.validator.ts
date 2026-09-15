import { NextRequest } from "next/server";
import { createCouponSchema, validateCouponSchema } from "@store4riders/shared-validation";

/**
 * CouponValidator
 * 
 * Handles extracting JSON payloads from incoming coupon requests
 * and strictly validating them against Zod schemas.
 */
export class CouponValidator {
  
  /**
   * Validates a request to apply a coupon code.
   * Extracts the coupon code and the cart total from the request.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<{code: string, cartTotal: number}>}
   */
  static async validateApplyCoupon(req: NextRequest) {
    const body = await req.json();
    const validatedData = validateCouponSchema.parse(body);
    
    // Fallback to 0 if cartTotal isn't passed (handled by service validation)
    const cartTotal = body.cartTotal || 0;
    
    return {
      code: validatedData.code,
      cartTotal,
    };
  }

  /**
   * Validates a request to create a new coupon in the system.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<any>} The parsed and validated coupon data.
   */
  static async validateCreate(req: NextRequest) {
    const body = await req.json();
    const validatedData = createCouponSchema.parse(body);
    
    return {
      ...validatedData,
      expiryDate: new Date(validatedData.expiryDate),
    };
  }
}
