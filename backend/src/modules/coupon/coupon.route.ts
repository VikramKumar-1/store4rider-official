import { NextRequest, NextResponse } from "next/server";
import { CouponController } from "./coupon.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Promotional discount coupon management and validation
 */

export async function couponRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  // 1. POST /api/v1/coupons/validate (Checkout - Strictly Registered Users Only)
  if (method === "POST" && pathLen === 1 && routePath[0] === "validate") {
    const userId = extractUserFromAuth(req);
    return await CouponController.validate(req, userId);
  }

  // 2. Admin Coupon Routes (Requires SuperAdmin or Admin)
  if (pathLen === 0) {
    // GET /api/v1/coupons -> List all coupons (Admin)
    if (method === "GET") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await CouponController.list(req);
    }

    // POST /api/v1/coupons -> Create new coupon (Admin)
    if (method === "POST") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await CouponController.create(req);
    }
  }

  if (pathLen === 1 && routePath[0] !== "validate") {
    const couponId = routePath[0];

    // GET /api/v1/coupons/:id -> Get coupon details (Admin)
    if (method === "GET") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await CouponController.getById(req, couponId);
    }

    // PUT /api/v1/coupons/:id -> Update coupon (Admin)
    if (method === "PUT") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await CouponController.update(req, couponId);
    }

    // DELETE /api/v1/coupons/:id -> Delete coupon (Admin)
    if (method === "DELETE") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await CouponController.delete(req, couponId);
    }
  }

  return null;
}
