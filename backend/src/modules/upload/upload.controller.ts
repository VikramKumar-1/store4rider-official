import { NextRequest, NextResponse } from "next/server";
import { UploadService } from "./upload.service";
import { UploadValidator } from "./upload.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * @class UploadController
 * @description Minimal HTTP controller for File Uploads, URL Scraping, and Preview Proxying.
 */
export class UploadController {
  static async getPresignedUrl(req: NextRequest) {
    const { fileName, fileType } = await UploadValidator.validatePresignedUrl(req);
    const url = await UploadService.generatePresignedUrl(fileName, fileType);
    return ApiResponse.success({ url }, "Presigned URL generated successfully");
  }

  static async directUpload(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return ApiResponse.error("No file provided in form data", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await UploadService.directUpload(buffer, file.name, file.type || "image/webp");
    return ApiResponse.success({ url }, "File uploaded successfully");
  }

  static async scrapeUrl(req: NextRequest) {
    const { url } = await UploadValidator.validateScrapeUrl(req);
    const result = await UploadService.scrapeImagesFromUrl(url);
    return ApiResponse.success(result, `Discovered ${result.images.length} images from URL`);
  }

  static async importFromUrl(req: NextRequest) {
    const { items, maxDimension, quality } = await UploadValidator.validateImportFromUrl(req);
    const result = await UploadService.importAndUploadImages(items, maxDimension, quality);
    return ApiResponse.success(
      result,
      `Successfully processed ${result.imported.length} image(s) to Store4Riders${
        result.errors.length ? ` (${result.errors.length} failed)` : ""
      }`
    );
  }

  /**
   * Safe preview proxy: fetches external images with proper User-Agent and Referer headers
   * so thumbnails always preview cleanly in the admin modal, even when hotlink-protected by external hosts.
   */
  static async proxyPreview(req: NextRequest): Promise<NextResponse> {
    const targetUrl = req.nextUrl.searchParams.get("url");
    if (!targetUrl) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    try {
      const parsed = new URL(targetUrl);
      let res = await fetch(targetUrl, {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Referer: parsed.origin,
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      // If rejected (some CDNs block when Referer is sent or mismatched), retry with clean headers without Referer
      if (!res.ok) {
        res = await fetch(targetUrl, {
          headers: {
            "User-Agent": BROWSER_USER_AGENT,
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(8000),
        });
      }

      if (!res.ok) {
        return new NextResponse(`Target returned HTTP ${res.status}`, { status: res.status });
      }

      const contentType = res.headers.get("content-type") || "image/jpeg";
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (err: any) {
      return new NextResponse(err.message || "Preview proxy error", { status: 502 });
    }
  }
}
