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
   *     tags: [Coupons]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
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
