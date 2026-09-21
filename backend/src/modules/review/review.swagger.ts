/**
 * Swagger Documentation
 */

/**
   * @swagger
   * /review:
   *   post:
   *     summary: Create a product review
   *     description: |
   *       ### ⭐️ What is the purpose of this API?
   *       Allows a logged-in user to leave a rating (1-5) and a comment on a product they purchased.
   *       
   *       ### 🛍️ Real-World Business Cases:
   *       - **Social Proof:** Displays real customer feedback on the Product Details Page to increase conversion rates.
   *       - **Data Integrity:** The API strictly checks that the `rating` is a valid number between 1 and 5. It also prevents XSS (Cross-Site Scripting) by sanitizing the `comment` field before saving it to MongoDB, so hackers can't inject malicious scripts into the review section.
   *     tags: [Reviews]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               productId:
   *                 type: string
   *               rating:
   *                 type: number
   *               comment:
   *                 type: string
   *     responses:
   *       201:
   *         description: Review created
   */

/**
   * @swagger
   * /review/product/{productId}:
   *   get:
   *     summary: Get reviews for a product
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of reviews
   */

// Fix for TypeScript isolatedModules error
export {};
