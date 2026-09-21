/**
 * Swagger Documentation for ADMIN module
 */

/**
   * @swagger
   * /admin/users:
   *   get:
   *     summary: List all users
   *     tags: [Admin]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Paginated users
   */

/**
     * @swagger
     * /admin/users/{id}/role:
     *   put:
     *     summary: Update user role
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               role:
     *                 type: string
     *     responses:
     *       200:
     *         description: Role updated
     */

/**
     * @swagger
     * /admin/users/{id}/status:
     *   put:
     *     summary: Enable/disable user
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               isActive:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Status updated
     */

/**
     * @swagger
     * /admin/dashboard/stats:
     *   get:
     *     summary: Get dashboard KPI stats
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Dashboard stats
     */

/**
     * @swagger
     * /admin/dashboard/recent-orders:
     *   get:
     *     summary: Get recent orders
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Recent orders
     */

/**
     * @swagger
     * /admin/dashboard/revenue-chart:
     *   get:
     *     summary: Get revenue chart data
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Revenue chart
     */

// Fix for TypeScript isolatedModules error
export {};
