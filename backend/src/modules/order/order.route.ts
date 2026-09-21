import { NextRequest, NextResponse } from "next/server";
/**
 * @file order.route.ts
 * @description Defines API endpoints for Orders and maps them to Controller methods.
 */
import { OrderController } from "./order.controller";
import { checkOrderRateLimit } from "../../core/middlewares/rateLimiter";

export async function orderRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  if (method === "POST" && pathLen === 0) {
    await checkOrderRateLimit(ip);
    return await OrderController.create(req);
  }

  if (method === "POST" && pathLen === 1 && routePath[0] === "webhook") {
    return await OrderController.webhook(req);
  }

  if (method === "POST" && pathLen === 1 && routePath[0] === "verify") {
    return await OrderController.verify(req);
  }

  if (method === "GET" && pathLen === 1 && routePath[0] === "me") {
    return await OrderController.myOrders(req);
  }

  if (method === "GET" && pathLen === 1) {
    return await OrderController.getById(req, routePath[0]);
  }

  return null;
}
