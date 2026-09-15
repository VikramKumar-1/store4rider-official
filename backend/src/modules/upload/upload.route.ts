import { NextRequest, NextResponse } from "next/server";
import { UploadController } from "./upload.controller";
import { checkOrderRateLimit } from "../../core/middlewares/rateLimiter";

export async function uploadRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

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
  if (req.method === "POST" && routePath.length === 1 && routePath[0] === "presigned-url") {
    await checkOrderRateLimit(ip);
    return await UploadController.getPresignedUrl(req);
  }

  return null;
}
