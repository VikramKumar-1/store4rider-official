import { NextRequest, NextResponse } from "next/server";
import { UploadController } from "./upload.controller";
import { checkOrderRateLimit } from "../../core/middlewares/rateLimiter";

export async function uploadRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

  if (req.method === "POST" && routePath.length === 1 && routePath[0] === "presigned-url") {
    await checkOrderRateLimit(ip);
    return await UploadController.getPresignedUrl(req);
  }

  if (req.method === "POST" && routePath.length === 1 && routePath[0] === "direct") {
    await checkOrderRateLimit(ip);
    return await UploadController.directUpload(req);
  }

  if (req.method === "POST" && routePath.length === 1 && routePath[0] === "scrape-url") {
    await checkOrderRateLimit(ip);
    return await UploadController.scrapeUrl(req);
  }

  if (req.method === "POST" && routePath.length === 1 && routePath[0] === "import-from-url") {
    await checkOrderRateLimit(ip);
    return await UploadController.importFromUrl(req);
  }

  if (req.method === "GET" && routePath.length === 1 && routePath[0] === "preview-proxy") {
    return await UploadController.proxyPreview(req);
  }

  return null;
}
