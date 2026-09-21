import { NextRequest, NextResponse } from "next/server";
import { UploadController } from "./upload.controller";
import { checkOrderRateLimit } from "../../core/middlewares/rateLimiter";

export async function uploadRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  if (req.method === "POST" && routePath.length === 1 && routePath[0] === "presigned-url") {
    await checkOrderRateLimit(ip);
    return await UploadController.getPresignedUrl(req);
  }

  return null;
}
