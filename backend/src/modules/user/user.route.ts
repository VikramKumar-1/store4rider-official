import { NextRequest, NextResponse } from "next/server";
/**
 * @file user.route.ts
 * @description Defines API endpoints for Users and maps them to Controller methods.
 */
import { UserController } from "./user.controller";

export async function userRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (pathLen === 1 && routePath[0] === "me") {
    if (method === "GET") return await UserController.getProfile(req);
    if (method === "PUT") return await UserController.updateProfile(req);
  }

  if (pathLen === 2 && routePath[0] === "me" && routePath[1] === "addresses") {
    if (method === "POST") return await UserController.addAddress(req);
  }

  return null;
}
