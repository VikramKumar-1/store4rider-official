import { NextRequest, NextResponse } from "next/server";
import { ShipmentController } from "./shipment.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";
import { UserService } from "../user/user.service";
import { AppError } from "../../core/errors/AppError";

/**
 * @swagger
 * tags:
 *   name: Shipments
 *   description: Shipment management and tracking
 */
export async function shipmentRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;

  // Webhooks (Public)
  if (method === "POST" && routePath[0] === "webhook" && routePath.length === 2) {
    const provider = routePath[1];
    return await ShipmentController.webhook(req, provider);
  }

  // ALL OTHER ROUTES REQUIRE AUTH
  const userId = extractUserFromAuth(req);

  // Admin Routes
  if (routePath[0] === "admin") {
    await checkAdmin(userId, UserService.getRole);

    // POST /api/v1/shipments/admin
    if (method === "POST" && routePath.length === 1) {
      return await ShipmentController.create(req);
    }
    
    // PUT /api/v1/shipments/admin/:id/status
    if (method === "PUT" && routePath.length === 3 && routePath[2] === "status") {
      const id = routePath[1];
      return await ShipmentController.updateStatus(req, id);
    }

    // POST /api/v1/shipments/admin/:id/sync
    if (method === "POST" && routePath.length === 3 && routePath[2] === "sync") {
      const id = routePath[1];
      return await ShipmentController.syncTracking(req, id);
    }
  }

  // User/Shared Routes
  // GET /api/v1/shipments/:id
  if (method === "GET" && routePath.length === 1 && routePath[0] !== "admin") {
    const id = routePath[0];
    return await ShipmentController.getById(req, id);
  }

  // GET /api/v1/shipments/order/:orderId
  if (method === "GET" && routePath[0] === "order" && routePath.length === 2) {
    const orderId = routePath[1];
    return await ShipmentController.getByOrderId(req, orderId);
  }

  // POST /api/v1/shipments/rates
  if (method === "POST" && routePath.length === 1 && routePath[0] === "rates") {
    return await ShipmentController.getRates(req);
  }

  throw new AppError("Route not found in shipments module", 404);
}
