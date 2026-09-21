import { NextRequest, NextResponse } from "next/server";
import { BrandController } from "./brand.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";

export async function brandRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "GET" && pathLen === 0) {
    return await BrandController.getAll(req);
  }

  if (method === "GET" && pathLen === 1) {
    return await BrandController.getById(req, routePath[0]);
  }

  if (method === "POST" && pathLen === 0) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await BrandController.create(req);
  }

  if (method === "PUT" && pathLen === 1) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await BrandController.update(req, routePath[0]);
  }

  if (method === "DELETE" && pathLen === 1) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await BrandController.delete(req, routePath[0]);
  }

  return null;
}
