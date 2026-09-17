import { NextRequest, NextResponse } from "next/server";
import { CouponController } from "./coupon.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";

export async function couponRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /coupon/validate:
   *   post:
   *     summary: Validate a coupon code
   *     description: |
   *       ### 🎫 What is the purpose of this API?
   *       Used during Checkout to apply discount codes (e.g., "DIWALI50").
   *       
   *       ### 🛍️ Real-World Business Cases:
   *       - **Expiry Checks:** The API checks if the current date is past the coupon's `expiryDate`.
   *       - **Minimum Spend Validation:** It ensures the user's cart subtotal meets the `minPurchaseAmount` before applying the discount.
   *       - **Usage Limits:** It prevents users from applying single-use coupons multiple times.
   *     tags: [Coupons]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 20
   *                 pattern: "^[A-Z0-9]+$"
   *                 description: "The coupon code in uppercase alphanumeric (e.g., 'DIWALI50'). Required."
   *     responses:
   *       200:
   *         description: Coupon is valid
   *       400:
   *         description: Invalid or expired coupon
   */
  if (method === "POST" && pathLen === 1 && routePath[0] === "validate") {
    // Requires Auth
    extractUserFromAuth(req);
    return await CouponController.validate(req);
  }

  if (method === "POST" && pathLen === 0) {
    // Requires Admin
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, async () => "admin");
    return await CouponController.create(req);
  }

  return null;
}
