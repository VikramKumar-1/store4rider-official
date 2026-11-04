/**
 * Swagger Documentation for Upload & Media Endpoints
 */

/**
 * @swagger
 * /upload/presigned-url:
 *   post:
 *     summary: Get AWS S3 Presigned URL for direct browser upload
 *     tags: [Media Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, fileType]
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *
 * /upload/scrape-url:
 *   post:
 *     summary: Discover and extract product images from an external webpage or image URL
 *     tags: [Media Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 description: Product page URL or direct image URL
 *     responses:
 *       200:
 *         description: List of discovered high-resolution images
 *
 * /upload/import-from-url:
 *   post:
 *     summary: Download images from URLs, convert to WebP, and upload directly to Store4Riders S3
 *     tags: [Media Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [url]
 *                   properties:
 *                     url:
 *                       type: string
 *                     altText:
 *                       type: string
 *               maxDimension:
 *                 type: integer
 *                 default: 1600
 *               quality:
 *                 type: number
 *                 default: 0.86
 *     responses:
 *       200:
 *         description: Images successfully converted and uploaded to S3
 */

export {};
