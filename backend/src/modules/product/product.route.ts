import { NextRequest, NextResponse } from "next/server";
/**
 * @file product.route.ts
 * @description Defines API endpoints for Products and maps them to Controller methods.
 */
import { ProductController } from "./product.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";

export async function productRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "GET" && pathLen === 0) {
    return await ProductController.list(req);
  }

  if (method === "POST" && pathLen === 0) {
    const userId = extractUserFromAuth(req);
    // Mock role fetch for now
    await checkAdmin(userId, UserService.getRole); 
    return await ProductController.create(req);
  }

  if (method === 'GET' && pathLen === 1 && routePath[0] === 'by-skus') {
    return await ProductController.getBySkus(req);
  }

  if (method === 'GET' && pathLen === 2 && routePath[1] === 'kit') {
    return await ProductController.getKit(req, routePath[0]);
  }

  if (pathLen === 1) {
    const param = routePath[0];

    if (method === "GET") {
      return await ProductController.getBySlug(req, param);
    }

    if (method === "PUT") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await ProductController.update(req, param);
    }

    if (method === "DELETE") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, UserService.getRole);
      return await ProductController.delete(req, param);
    }
  }

  return null; // Route not matched
}
