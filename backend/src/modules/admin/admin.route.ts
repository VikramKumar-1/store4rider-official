import { NextRequest, NextResponse } from "next/server";
import { AdminController } from "./admin.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkPermission } from "../../core/middlewares/permission";
import { PermissionAction } from "../../core/config/permissions";
import { UserService } from "../user/user.service";

export async function adminRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "GET" && pathLen === 1 && routePath[0] === "users") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_USERS, UserService.getRole);
    return await AdminController.getUsers(req);
  }

  if (pathLen === 3 && routePath[0] === "users") {
    const targetUserId = routePath[1];

    if (method === "PUT" && routePath[2] === "role") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.MANAGE_ROLES, UserService.getRole);
      return await AdminController.updateRole(req, targetUserId);
    }

    if (method === "PUT" && routePath[2] === "status") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.MANAGE_USERS, UserService.getRole);
      return await AdminController.updateStatus(req, targetUserId);
    }
  }

  if (pathLen === 2 && routePath[0] === "dashboard") {
    const action = routePath[1];

    if (method === "GET" && action === "stats") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getDashboardStats(req);
    }

    if (method === "GET" && action === "recent-orders") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getRecentOrders(req);
    }

    if (method === "GET" && action === "revenue-chart") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getRevenueChart(req);
    }
  }

  if (method === "POST" && pathLen === 2 && routePath[0] === "products" && routePath[1] === "bulk-update") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_PRODUCTS, UserService.getRole);
    return await AdminController.bulkUpdateProducts(req);
  }

  return null;
}
