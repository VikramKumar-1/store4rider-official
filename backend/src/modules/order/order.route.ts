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
   *       ### 📦 What is the purpose of this API?
   *       This is the core **Checkout & Order Creation** engine. It securely converts a user's Cart into an official, unpaid Order.
   *       
   *       ### 🛍️ Real-World Business Cases:
   *       - **Payment Gateway Integration:** The frontend cannot just say "I paid ₹5000". That is highly insecure. Instead, this API calculates the total strictly on the server, contacts Razorpay, and generates a cryptographically signed `razorpayOrderId`. 
   *       - **Fraud Prevention:** Customers cannot manipulate cart prices via browser DevTools. The backend looks up the actual product prices from the database at the exact moment of checkout.
   *       
   *       ### 🔒 Security Layers:
   *       - **Rate Limiting:** Protects against automated bots generating fake thousands of unpaid orders (DDoS on Razorpay limits).
   *       - **Inventory Locking (Future):** Prepares the system to reserve stock temporarily for 15 minutes while the user pays.
   *       
   *       ### 📋 How to test?
   *       1. Ensure you are logged in and have items in your `/cart`.
   *       2. Get a `shippingAddressId` from the `/user/me/addresses` API.
   *       3. Hit "Test Request". You will receive an official Razorpay Order ID.
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - shippingAddressId
   *             properties:
   *               shippingAddressId:
   *                 type: string
   *                 pattern: "^[0-9a-fA-F]{24}$"
   *                 description: "Valid 24-character MongoDB ObjectId for the user's saved address. Required."
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
   *     summary: Handle Razorpay webhook (Asynchronous Payment Confirmation)
   *     tags: [Orders]
   *     description: |
   *       **Why Webhooks?**
   *       Frontend verification is NOT trustworthy. If a user closes the browser during payment, the frontend script won't run.
   *       To ensure we never miss a payment, we rely on Razorpay Server-to-Server Webhooks.
   *       
   *       **Security Architecture (How we handle Money):**
   *       1. **Signature Validation:** We compute an HMAC SHA256 signature using our `RAZORPAY_WEBHOOK_SECRET` and compare it with the `X-Razorpay-Signature` header. If it mismatches, we reject it (prevents spoofing).
   *       2. **Idempotency:** Webhooks can fire multiple times. We check the order status before updating to ensure we don't process the same payment twice.
   *       3. **Event Mapping:** 
   *          - `payment.captured` -> Updates order to `PAID`, triggers order confirmation email via AWS SES.
   *          - `payment.failed` -> Updates order to `FAILED`.
   *          - `refund.processed` -> Updates order to `REFUNDED` and restores stock.
   *       
   *       This ensures 100% financial accuracy and prevents hackers from artificially marking orders as "Paid" via client-side manipulation.
   *     parameters:
   *       - in: header
   *         name: x-razorpay-signature
   *         required: true
   *         schema:
   *           type: string
   *         description: HMAC SHA256 signature sent by Razorpay
   *     responses:
   *       200:
   *         description: Webhook processed successfully
   */
  if (method === "POST" && pathLen === 1 && routePath[0] === "webhook") {
    return await OrderController.webhook(req);
  }

  /**
   * @swagger
   * /order/verify:
   *   post:
   *     summary: Synchronous Razorpay Payment Verification
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     description: |
   *       **Purpose:**
   *       While Webhooks are the primary source of truth for payments, this endpoint allows the frontend to immediately verify a payment to show a "Success Screen" without waiting for the webhook to arrive.
   *       
   *       **Validation Logic:**
   *       Calculates `HMAC_SHA256(razorpayOrderId + "|" + paymentId, RAZORPAY_SECRET)`.
   *       If it matches the `signature` from the frontend, we immediately mark the order as `PAID`.
   *       If the webhook arrives later, it will safely ignore the duplicate update (Idempotency).
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - razorpayOrderId
   *               - paymentId
   *               - signature
   *             properties:
   *               razorpayOrderId:
   *                 type: string
   *                 description: The Razorpay Order ID created initially
   *               paymentId:
   *                 type: string
   *                 description: The successful transaction ID
   *               signature:
   *                 type: string
   *                 description: Frontend generated signature to verify against the backend
   *     responses:
   *       200:
   *         description: Payment verified and order updated
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
