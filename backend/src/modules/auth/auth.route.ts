import { NextRequest, NextResponse } from "next/server";
/**
 * @file auth.route.ts
 * @description Defines API endpoints for Authentication and maps them to Controller methods.
 */
import { AuthController } from "./auth.controller";
import { checkRateLimit } from "../../core/middlewares/rateLimiter";

export async function authRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  if (method === "POST" && pathLen === 1) {
    const action = routePath[0];

    if (action === "login") {
      await checkRateLimit(ip);
      return await AuthController.login(req);
    }

    if (action === "register") {
      await checkRateLimit(ip);
      return await AuthController.register(req);
    }

    if (action === "refresh") {
      return await AuthController.refresh(req);
    }

    if (action === "logout") {
      return await AuthController.logout(req);
    }
  }

  return null;
}
