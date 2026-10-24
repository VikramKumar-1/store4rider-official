import { NextRequest, NextResponse } from "next/server";
import { AdminController } from "./admin.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkPermission } from "../../core/middlewares/permission";
import { PermissionAction } from "../../core/config/permissions";
import { UserService } from "../user/user.service";

/**
 * @swagger
 * /api/v1/admin/stream:
 *   get:
 *     summary: Real-time Server-Sent Events (SSE) stream for admin portal
 *     description: Provides instant server push for orders, status updates, and shipments with 0 idle DB queries.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Persistent text/event-stream connection established
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function adminRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (pathLen === 1 && routePath[0] === "stream" && method === "GET") {
    return await AdminController.getLiveStream(req);
  }

  if (pathLen === 1 && routePath[0] === "users") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_USERS, UserService.getRole);

    if (method === "GET") {
      return await AdminController.getUsers(req);
    }
    if (method === "POST") {
      return await AdminController.createStaffUser(req, userId);
    }
  }

  if (pathLen === 2 && routePath[0] === "users" && method === "DELETE") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_USERS, UserService.getRole);
    const targetUserId = routePath[1];
    return await AdminController.deleteUser(req, targetUserId, userId);
  }

  if (pathLen === 3 && routePath[0] === "users") {
    const targetUserId = routePath[1];
    const userId = extractUserFromAuth(req);

    if (method === "PUT" && routePath[2] === "role") {
      await checkPermission(userId, PermissionAction.MANAGE_ROLES, UserService.getRole);
      return await AdminController.updateRole(req, targetUserId, userId);
    }

    if (method === "PUT" && routePath[2] === "status") {
      await checkPermission(userId, PermissionAction.MANAGE_USERS, UserService.getRole);
      return await AdminController.updateStatus(req, targetUserId, userId);
    }
  }

  if (pathLen === 2 && routePath[0] === "dashboard") {
    const action = routePath[1];

    if (method === "GET" && action === "stats") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getDashboardStats(req, userId);
    }

    if (method === "GET" && action === "logistics-stats") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getLogisticsDashboardStats(req);
    }

    if (method === "GET" && action === "recent-orders") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getRecentOrders(req);
    }

    if (method === "GET" && action === "revenue-chart") {
      const userId = extractUserFromAuth(req);
      await checkPermission(userId, PermissionAction.VIEW_DASHBOARD, UserService.getRole);
      return await AdminController.getRevenueChart(req, userId);
    }
  }

  if (method === "POST" && pathLen === 2 && routePath[0] === "products" && routePath[1] === "bulk-update") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_PRODUCTS, UserService.getRole);
    return await AdminController.bulkUpdateProducts(req);
  }

  if (pathLen === 2 && routePath[0] === "products" && routePath[1] === "test-product") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_PRODUCTS, UserService.getRole);

    if (method === "GET") {
      return await AdminController.getTestProduct(req);
    }
    if (method === "POST") {
      return await AdminController.createTestProduct(req);
    }
    if (method === "DELETE") {
      return await AdminController.deleteTestProduct(req);
    }
  }

  if (pathLen === 1 && routePath[0] === "settings") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_USERS, UserService.getRole); 
    
    const { SettingController } = await import("../settings/setting.controller");

    if (method === "GET") {
      return await SettingController.getSettings(req);
    }
    
    if (method === "PUT") {
      return await SettingController.updateSettings(req);
    }
  }

  if (method === "GET" && pathLen === 1 && routePath[0] === "payment-logs") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_ORDERS, UserService.getRole); 
    const { AdminController: AdminCtrl } = await import("./admin.controller");
    return await AdminCtrl.getPaymentLogs(req);
  }

  if (routePath[0] === "shipments") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_ORDERS, UserService.getRole);
    const { ShippingController } = await import("../shipping/shipping.controller");

    if (method === "GET" && pathLen === 1) {
      return await ShippingController.getAdminShipments(req);
    }
    if (method === "GET" && pathLen === 2) {
      return await ShippingController.getShipmentById(req, routePath[1]);
    }
  }

  return null;
}
