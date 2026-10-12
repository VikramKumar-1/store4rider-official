import { NextRequest } from "next/server";
import { AppError } from "../../core/errors/AppError";
import { ShippingController } from "./shipping.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkPermission } from "../../core/middlewares/permission";
import { PermissionAction } from "../../core/config/permissions";
import { UserService } from "../user/user.service";

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Core Shipping Orchestration (Shiprocket, Delhivery, Xpressbees, Manual)
 */
export async function shippingRouter(req: NextRequest, routePath: string[]) {
  const method = req.method;

  // ---------------------------------------------------------------------------
  // 1. PUBLIC ROUTES (No Auth Required)
  // ---------------------------------------------------------------------------

  // Webhooks from Providers: POST /api/v1/shipping/webhooks/:provider or /shipments/webhooks/:provider
  if (method === "POST" && routePath[0] === "webhooks" && routePath.length === 2) {
    const provider = routePath[1];
    return await ShippingController.handleWebhook(req, provider);
  }

  // Pincode Serviceability Check: POST /api/v1/shipping/serviceability
  if (method === "POST" && routePath.length === 1 && routePath[0] === "serviceability") {
    return await ShippingController.checkServiceability(req);
  }

  // Live Shipping Rates: POST /api/v1/shipping/rates
  if (method === "POST" && routePath.length === 1 && routePath[0] === "rates") {
    return await ShippingController.calculateRates(req);
  }

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATED USER ROUTES (Customer or Admin)
  // ---------------------------------------------------------------------------
  const userId = extractUserFromAuth(req);

  // Customer Tracking: GET /api/v1/shipping/order/:orderId or /shipments/order/:orderId
  if (method === "GET" && routePath.length === 2 && routePath[0] === "order") {
    const orderId = routePath[1];
    return await ShippingController.getShipmentsByOrderId(req, orderId);
  }

  // ---------------------------------------------------------------------------
  // 3. ADMIN ONLY ROUTES (Strict Permission Enforcement)
  // ---------------------------------------------------------------------------
  await checkPermission(userId, PermissionAction.MANAGE_ORDERS, UserService.getRole);

  // POST /api/v1/shipments/admin/push-shiprocket
  if (method === "POST" && routePath.length === 2 && routePath[0] === "admin" && routePath[1] === "push-shiprocket") {
    return await ShippingController.pushOrderToShiprocket(req);
  }

  // POST /api/v1/shipments/admin/direct
  if (method === "POST" && routePath.length === 2 && routePath[0] === "admin" && routePath[1] === "direct") {
    return await ShippingController.createDirectShipment(req);
  }

  // POST /api/v1/shipments/admin/manual
  if (method === "POST" && routePath.length === 2 && routePath[0] === "admin" && routePath[1] === "manual") {
    return await ShippingController.createManualShipment(req);
  }

  // POST /api/v1/shipments/admin (General creation from fulfillment panel)
  if (method === "POST" && routePath.length === 1 && routePath[0] === "admin") {
    const body = await req.clone().json().catch(() => ({}));
    if (body.provider === "shiprocket") {
      return await ShippingController.pushOrderToShiprocket(req);
    } else if (body.provider === "manual") {
      return await ShippingController.createManualShipment(req);
    } else {
      return await ShippingController.createDirectShipment(req);
    }
  }

  // GET /api/v1/shipments/admin (List shipments)
  if (method === "GET" && routePath.length === 1 && routePath[0] === "admin") {
    return await ShippingController.getAdminShipments(req);
  }

  // GET /api/v1/shipments/admin/:id
  if (method === "GET" && routePath.length === 2 && routePath[0] === "admin") {
    return await ShippingController.getShipmentById(req, routePath[1]);
  }

  // POST /api/v1/shipments/admin/:id/sync
  if (method === "POST" && routePath.length === 3 && routePath[0] === "admin" && routePath[2] === "sync") {
    return await ShippingController.syncTracking(req, routePath[1]);
  }

  // POST /api/v1/shipments/admin/:id/pickup
  if (method === "POST" && routePath.length === 3 && routePath[0] === "admin" && routePath[2] === "pickup") {
    return await ShippingController.requestPickup(req, routePath[1]);
  }

  // Settings Toggles: GET / PUT /api/v1/shipping/settings
  if (routePath[0] === "settings" && routePath.length === 1) {
    if (method === "GET") return await ShippingController.getSettings(req);
    if (method === "PUT") return await ShippingController.updateSettings(req);
  }

  throw new AppError(`Route not found: ${method} /api/v1/shipping/${routePath.join("/")}`, 404);
}
