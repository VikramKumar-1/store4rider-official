/**
 * Swagger Documentation
 */

/**
   * @swagger
   * /category/tree:
   *   get:
   *     summary: Get full category tree
   *     description: |
   *       ### 🌲 What is the purpose of this API?
   *       This is one of the most critical endpoints for the UI. It returns the entire category structure (e.g., Helmets -> Full Face -> Carbon Fiber) in a nested tree format.
   *       
   *       ### 🚀 Performance & Architecture Details:
   *       - **Redis Caching:** Because categories rarely change but are loaded on *every single page* of the frontend (for the Navigation Menu), this API caches the entire tree in Redis. 
   *       - **Load Time:** By reading from RAM (Redis) instead of querying MongoDB every time, this endpoint responds in under 10 milliseconds, making the website feel lightning fast!
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: Hierarchical list of categories
   */

/**
   * @swagger
   * /category:
   *   post:
   *     summary: Create a category [Admin Only]
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               parentId:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Category created
   */

// Fix for TypeScript isolatedModules error
export {};
