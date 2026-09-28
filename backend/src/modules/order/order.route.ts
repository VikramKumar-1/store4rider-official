import { NextRequest, NextResponse } from "next/server";
/**
 * @file order.route.ts
 * @description Defines API endpoints for Orders and maps them to Controller methods.
 */
import { OrderController } from "./order.controller";
import { checkOrderRateLimit } from "../../core/middlewares/rateLimiter";

/**
 * @swagger
 * /api/v1/orders/admin:
 *   get:
 *     summary: List all orders (Admin)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated orders list
 * /api/v1/orders/admin/{id}/status:
 *   put:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Order updated
 * /api/v1/orders/admin/{id}/notes:
 *   post:
 *     summary: Add internal note to order (Admin)
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *     responses:
 *       200:
 *         description: Note added
 */
export async function orderRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  if (method === "POST" && pathLen === 0) {
    await checkOrderRateLimit(ip);
    return await OrderController.create(req);
  }

  if (method === "POST" && routePath[0] === "webhook") {
    return await OrderController.webhook(req, routePath);
  }

  if (method === "POST" && pathLen === 1 && routePath[0] === "verify") {
    return await OrderController.verify(req);
  }

  if (method === "GET" && pathLen === 1 && routePath[0] === "me") {
    return await OrderController.myOrders(req);
  }

  if (method === "GET" && pathLen === 1 && routePath[0] === "admin") {
    return await OrderController.adminGetAll(req);
  }

  if (method === "GET" && pathLen === 2 && routePath[0] === "admin") {
    return await OrderController.adminGetById(req, routePath[1]);
  }

  if (method === "PUT" && pathLen === 3 && routePath[0] === "admin" && routePath[2] === "status") {
    return await OrderController.adminUpdateStatus(req, routePath[1]);
  }

  if (method === "POST" && pathLen === 3 && routePath[0] === "admin" && routePath[2] === "notes") {
    return await OrderController.adminAddNote(req, routePath[1]);
  }

  if (method === "PUT" && pathLen === 3 && routePath[0] === "admin" && routePath[2] === "return") {
    return await OrderController.adminHandleReturn(req, routePath[1]);
  }

  if (method === "POST" && pathLen === 2 && routePath[1] === "return") {
    return await OrderController.requestReturn(req, routePath[0]);
  }

  if (method === "GET" && pathLen === 2 && routePath[1] === "invoice") {
    return await OrderController.generateInvoice(req, routePath[0]);
  }

  if (method === "GET" && pathLen === 1 && routePath[0] !== "admin") {
    return await OrderController.getById(req, routePath[0]);
  }

  return null;
}
