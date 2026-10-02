import { NextRequest } from "next/server";
import { AppError } from "../../core/errors/AppError";
import { ShippingController } from "./shipping.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Core Shipping Orchestration (Rates, Creation, Webhooks, Toggles)
 */
export async function shippingRouter(req: NextRequest, routePath: string[]) {
  const method = req.method;

  // 1. PUBLIC ROUTES (No Auth Required)
  // Webhooks from Providers
  if (method === "POST" && routePath[0] === "webhooks" && routePath.length === 2) {
    const provider = routePath[1]; // e.g., "shiprocket" or "delhivery"
    return await ShippingController.handleWebhook(req, provider);
  }

  // ---------------------------------------------------------------------------
  // AUTH REQUIRED ROUTES
  // ---------------------------------------------------------------------------
  await extractUserFromAuth(req);
  const isAdmin = req.headers.get("x-user-role") === "admin";

  // POST /api/v1/shipping/rates
  if (method === "POST" && routePath.length === 1 && routePath[0] === "rates") {
    return await ShippingController.calculateRates(req);
  }

  // POST /api/v1/shipments/serviceability
  if (method === "POST" && routePath.length === 1 && routePath[0] === "serviceability") {
    return await ShippingController.checkServiceability(req);
  }

  // POST /api/v1/shipping/create
  if (method === "POST" && routePath.length === 1 && routePath[0] === "create") {
    // Ideally this is called internally by Order service, but kept for manual override test
    if (!isAdmin) throw new AppError("Only Admin can trigger manual shipment creation.", 403);
    return await ShippingController.createShipment(req);
  }

  // ---------------------------------------------------------------------------
  // ADMIN ONLY ROUTES
  // ---------------------------------------------------------------------------
  if (!isAdmin) {
    throw new AppError("Forbidden. Admin access required.", 403);
  }

  // Settings Toggles (Active/Inactive Couriers)
  if (routePath[0] === "settings" && routePath.length === 1) {
    if (method === "GET") return await ShippingController.getSettings(req);
    if (method === "PUT") return await ShippingController.updateSettings(req);
  }

  // POST /api/v1/shipping/:id/cancel
  if (method === "POST" && routePath.length === 2 && routePath[1] === "cancel") {
    return await ShippingController.cancelShipment(req, routePath[0]);
  }

  // POST /api/v1/shipping/return
  if (method === "POST" && routePath.length === 1 && routePath[0] === "return") {
    return await ShippingController.createReturnShipment(req);
  }

  // POST /api/v1/shipping/rto-delivered
  if (method === "POST" && routePath.length === 1 && routePath[0] === "rto-delivered") {
    return await ShippingController.markRtoDelivered(req);
  }

  throw new AppError(`Route not found: ${method} /api/v1/shipping/${routePath.join("/")}`, 404);
}
