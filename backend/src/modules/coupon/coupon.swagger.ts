/**
 * Swagger Documentation
 */

/**
   * @swagger
   * /coupon/validate:
   *   post:
   *     summary: Validate a coupon code
   *     description: |
   *       ### 🎫 What is the purpose of this API?
   *       Used during Checkout to apply discount codes (e.g., "DIWALI50").
   *       
   *       ### 🛍️ Real-World Business Cases:
   *       - **Expiry Checks:** The API checks if the current date is past the coupon's `expiryDate`.
   *       - **Minimum Spend Validation:** It ensures the user's cart subtotal meets the `minPurchaseAmount` before applying the discount.
   *       - **Usage Limits:** It prevents users from applying single-use coupons multiple times.
   *     tags: [Coupons]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *             properties:
   *               code:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 20
   *                 pattern: "^[A-Z0-9]+$"
   *                 description: "The coupon code in uppercase alphanumeric (e.g., 'DIWALI50'). Required."
   *     responses:
   *       200:
   *         description: Coupon is valid
   *       400:
   *         description: Invalid or expired coupon
   */

// Fix for TypeScript isolatedModules error
export {};
