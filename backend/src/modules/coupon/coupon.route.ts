import { NextRequest, NextResponse } from "next/server";
import { CouponController } from "./coupon.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";

export async function couponRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "POST" && pathLen === 1 && routePath[0] === "validate") {
    // Requires Auth
    extractUserFromAuth(req);
    return await CouponController.validate(req);
  }

  if (method === "POST" && pathLen === 0) {
    // Requires Admin
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await CouponController.create(req);
  }

  return null;
}
