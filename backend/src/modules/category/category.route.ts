import { NextRequest, NextResponse } from "next/server";
/**
 * @file category.route.ts
 * @description Defines API endpoints for Categories and maps them to Controller methods.
 */
import { CategoryController } from "./category.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";

export async function categoryRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "GET" && pathLen === 1 && routePath[0] === "tree") {
    return await CategoryController.getTree(req);
  }

  if ((method === "POST" || method === "GET") && pathLen === 1 && routePath[0] === "revalidate") {
    const { CategoryService } = await import("./category.service");
    await CategoryService.invalidateCache();
    const { ApiResponse } = await import("../../core/response/ApiResponse");
    return ApiResponse.success(null, "Category cache invalidated successfully");
  }

  if (method === "GET" && pathLen === 1) {
    return await CategoryController.getBySlug(req, routePath[0]);
  }

  if (method === "POST" && pathLen === 0) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await CategoryController.create(req);
  }

  if (method === "PUT" && pathLen === 1) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await CategoryController.update(req, routePath[0]);
  }

  if (method === "DELETE" && pathLen === 1) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return await CategoryController.delete(req, routePath[0]);
  }

  return null;
}
