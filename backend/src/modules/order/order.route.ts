import { NextRequest, NextResponse } from "next/server";
/**
 * @file order.route.ts
 * @description Defines API endpoints for Orders and maps them to Controller methods.
 */
import { OrderController } from "./order.controller";
import { checkOrderRateLimit } from "../../core/middlewares/rateLimiter";

export async function orderRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  /**
   * @swagger
   * /order:
   *   post:
   *     summary: Create a new order
   *     operationId: createOrder
   *     description: |
   *       ### 📦 What is this API?
   *       This is the core Checkout API. It converts the user's active Cart into a Razorpay Order so the user can make a payment.
   *       
   *       ### ⚙️ How it works?
   *       1. Validates your `shippingAddressId` (Must exist in your User Profile).
   *       2. Fetches your active **Cart** to calculate the final `totalAmount`.
   *       3. Generates a secure Order via **Razorpay SDK**.
   *       4. Saves the order status as `pending` in **MongoDB**.
   *       
   *       ### 📋 What it takes (Input)?
   *       - `shippingAddressId` (String): The Mongo ID of the address you want to ship to.
   *       
   *       ### 🧪 How to test?
   *       1. First, make sure you have items in your `/cart`!
   *       2. Get an address ID from `/user/me/addresses`.
   *       3. Paste the ID in the JSON Body on the right.
   *       4. Click **"Send API Request"** to get your Razorpay Order ID!
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               shippingAddressId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Order generated
   */
  if (method === "POST" && pathLen === 0) {
    await checkOrderRateLimit(ip);
    return await OrderController.create(req);
  }

  /**
   * @swagger
   * /order/webhook:
   *   post:
   *     summary: Handle Razorpay webhook
   *     tags: [Orders]
   */
  if (method === "POST" && pathLen === 1 && routePath[0] === "webhook") {
    return await OrderController.webhook(req);
  }

  /**
   * @swagger
   * /order/verify:
   *   post:
   *     summary: Verify Razorpay Payment Signature
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               razorpayOrderId:
   *                 type: string
   *               paymentId:
   *                 type: string
   *               signature:
   *                 type: string
   *     responses:
   *       200:
   *         description: Payment verified
   */
  if (method === "POST" && pathLen === 1 && routePath[0] === "verify") {
    return await OrderController.verify(req);
  }

  /**
   * @swagger
   * /order/me:
   *   get:
   *     summary: Get my orders
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: My orders list
   */
  if (method === "GET" && pathLen === 1 && routePath[0] === "me") {
    return await OrderController.myOrders(req);
  }

  /**
   * @swagger
   * /order/{id}:
   *   get:
   *     summary: Get order by ID
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Order details
   */
  if (method === "GET" && pathLen === 1) {
    return await OrderController.getById(req, routePath[0]);
  }

  return null;
}
