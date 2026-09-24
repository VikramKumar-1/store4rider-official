/**
 * Swagger Documentation
 */

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
   *       - **Payment Gateway Integration:** The frontend cannot just say "I paid ₹5000". That is highly insecure. Instead, this API calculates the total strictly on the server, contacts the Gateway, and generates a cryptographically signed `gatewayOrderId`. 
   *       - **Fraud Prevention:** Customers cannot manipulate cart prices via browser DevTools. The backend looks up the actual product prices from the database at the exact moment of checkout.
   *       
   *       ### 🔒 Security Layers:
   *       - **Rate Limiting:** Protects against automated bots generating fake thousands of unpaid orders.
   *       - **Inventory Locking (Future):** Prepares the system to reserve stock temporarily for 15 minutes while the user pays.
   *       
   *       ### 📋 How to test?
   *       1. Ensure you are logged in and have items in your `/cart`.
   *       2. Get a `shippingAddressId` from the `/user/me/addresses` API.
   *       3. Hit "Test Request". You will receive an official Gateway Order ID.
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

/**
   * @swagger
   * /order/webhook:
   *   post:
   *     summary: Handle Webhook (Asynchronous Payment Confirmation)
   *     tags: [Orders]
   *     description: |
   *       **Why Webhooks?**
   *       Frontend verification is NOT trustworthy. If a user closes the browser during payment, the frontend script won't run.
   *       To ensure we never miss a payment, we rely on Server-to-Server Webhooks.
   *       
   *       **Security Architecture (How we handle Money):**
   *       1. **Signature Validation:** We compute an HMAC SHA256/SHA512 signature using our Secret and compare it with the signature header. If it mismatches, we reject it (prevents spoofing).
   *       2. **Idempotency:** Webhooks can fire multiple times. We check the order status before updating to ensure we don't process the same payment twice.
   *       3. **Event Mapping:** 
   *          - `payment.captured` -> Updates order to `PAID`, triggers order confirmation email via AWS SES.
   *          - `payment.failed` -> Updates order to `FAILED`.
   *          - `refund.processed` -> Updates order to `REFUNDED` and restores stock.
   *       
   *       This ensures 100% financial accuracy and prevents hackers from artificially marking orders as "Paid" via client-side manipulation.
   *     parameters:
   *       - in: header
   *         name: x-payu-signature
   *         required: true
   *         schema:
   *           type: string
   *         description: HMAC SHA512 signature sent by PayU
   *     responses:
   *       200:
   *         description: Webhook processed successfully
   */

/**
   * @swagger
   * /order/verify:
   *   post:
   *     summary: Synchronous Payment Verification
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     description: |
   *       **Purpose:**
   *       While Webhooks are the primary source of truth for payments, this endpoint allows the frontend to immediately verify a payment to show a "Success Screen" without waiting for the webhook to arrive.
   *       
   *       **Validation Logic:**
   *       Calculates HMAC signature and verifies.
   *       If it matches the `signature` from the frontend, we immediately mark the order as `PAID`.
   *       If the webhook arrives later, it will safely ignore the duplicate update (Idempotency).
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - gatewayOrderId
   *               - paymentId
   *               - signature
   *             properties:
   *               gatewayOrderId:
   *                 type: string
   *                 description: The Gateway Order ID created initially
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

// Fix for TypeScript isolatedModules error
export {};
