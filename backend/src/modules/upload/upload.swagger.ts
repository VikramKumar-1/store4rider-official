/**
 * Swagger Documentation
 */

/**
   * @swagger
   * /upload/presigned-url:
   *   post:
   *     summary: Get AWS S3 Presigned URL for direct upload
   *     tags: [Media Uploads]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fileName:
   *                 type: string
   *               fileType:
   *                 type: string
   *     responses:
   *       200:
   *         description: Presigned URL generated
   */

// Fix for TypeScript isolatedModules error
export {};
