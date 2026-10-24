import { NextRequest, NextResponse } from "next/server";
import { ContactController } from "./contact.controller";
import { checkRateLimit } from "../../core/middlewares/rateLimiter";

/**
 * @swagger
 * /api/v1/contact:
 *   post:
 *     summary: Submit a contact us / customer care issue
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               orderNumber: { type: string }
 *               category: { type: string, enum: [order_issue, payment_issue, return_exchange, product_sizing, shipping_delay, other] }
 *               subject: { type: string }
 *               message: { type: string }
 *     responses:
 *       201:
 *         description: Issue logged with ticketId
 * 
 * /api/v1/contact/admin:
 *   get:
 *     summary: List all contact issues (Staff/Customer Care)
 *     tags: [Contact]
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
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated contact issues
 * 
 * /api/v1/contact/admin/stats:
 *   get:
 *     summary: Get counts of open, in_progress, resolved tickets
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: Statistics summary
 */
export async function contactRouter(
  req: NextRequest,
  routePath: string[]
): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  // POST /contact (Public submission)
  if (method === "POST" && pathLen === 0) {
    await checkRateLimit(ip);
    return await ContactController.submit(req);
  }

  // GET /contact/admin/stats
  if (method === "GET" && pathLen === 2 && routePath[0] === "admin" && routePath[1] === "stats") {
    return await ContactController.adminGetStats(req);
  }

  // GET /contact/admin (Paginated list)
  if (method === "GET" && pathLen === 1 && routePath[0] === "admin") {
    return await ContactController.adminGetAll(req);
  }

  // GET /contact/admin/:id
  if (method === "GET" && pathLen === 2 && routePath[0] === "admin") {
    return await ContactController.adminGetById(req, routePath[1]);
  }

  // PUT /contact/admin/:id/status
  if (method === "PUT" && pathLen === 3 && routePath[0] === "admin" && routePath[2] === "status") {
    return await ContactController.adminUpdateStatus(req, routePath[1]);
  }

  // POST /contact/admin/:id/notes
  if (method === "POST" && pathLen === 3 && routePath[0] === "admin" && routePath[2] === "notes") {
    return await ContactController.adminAddNote(req, routePath[1]);
  }

  return null;
}
