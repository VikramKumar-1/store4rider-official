import * as cheerio from "cheerio";
import sharp from "sharp";
import { getPresignedUrl, uploadBufferToS3 } from "../../core/storage/s3";
import { AppError } from "../../core/errors/AppError";
import { logger } from "../../core/utils/logger";

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface DiscoveredImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface ScrapeResult {
  pageTitle: string;
  isDirectImage: boolean;
  images: DiscoveredImage[];
}

export interface ImportedImageResult {
  originalUrl: string;
  s3Url: string;
  altText: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  skippedRecompression: boolean;
}

/**
 * @class UploadService
 * @description Core business logic for file uploads, direct S3 streaming,
 * intelligent webpage image discovery, and lossless/smart WebP optimization.
 */
export class UploadService {
  /**
   * Generates AWS S3 pre-signed URL for direct browser uploads.
   */
  static async generatePresignedUrl(fileName: string, fileType: string): Promise<string> {
    return await getPresignedUrl(fileName, fileType);
  }

  /**
   * Directly uploads an image buffer to S3 or self-hosted public storage.
   */
  static async directUpload(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
    return await uploadBufferToS3(buffer, fileName, contentType);
  }

  /**
   * Inspects a given URL (webpage or direct image) and discovers all high-resolution product photos.
   */
  static async scrapeImagesFromUrl(targetUrl: string): Promise<ScrapeResult> {
    const trimmed = targetUrl.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmed);
    } catch {
      throw new AppError("Invalid URL provided", 400);
    }

    // Check if it's already a direct image extension
    const imageExtensions = /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i;
    if (imageExtensions.test(parsedUrl.pathname)) {
      const fileName = parsedUrl.pathname.split("/").pop()?.replace(/\.[^/.]+$/, "") || "Product Photo";
      const altText = decodeURIComponent(fileName).replace(/[-_]+/g, " ");
      return {
        pageTitle: altText,
        isDirectImage: true,
        images: [{ url: trimmed, altText, isPrimary: true }],
      };
    }

    // Fetch the target webpage
    let html = "";
    let responseContentType = "";
    try {
      const res = await fetch(trimmed, {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(12000), // 12 second safety timeout
      });

      if (!res.ok) {
        throw new Error(`Target returned HTTP ${res.status} (${res.statusText})`);
      }

      responseContentType = res.headers.get("content-type") || "";

      // If server returned an image directly regardless of URL extension
      if (responseContentType.startsWith("image/")) {
        return {
          pageTitle: "Direct Image",
          isDirectImage: true,
          images: [{ url: trimmed, altText: "Product Photo", isPrimary: true }],
        };
      }

      html = await res.text();
    } catch (err: any) {
      logger.error({ err, url: trimmed }, "Failed to fetch webpage for image scraping");
      throw new AppError(`Could not access URL: ${err.message || "Connection timed out"}`, 400);
    }

    const $ = cheerio.load(html);
    const pageTitle =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      $("h1").first().text().trim() ||
      "Product Gallery";

    const candidateUrls = new Map<string, { url: string; altText: string; isPrimary?: boolean }>();

    const getDedupeKey = (urlStr: string): string => {
      try {
        const u = new URL(urlStr);
        // If Wikimedia thumbnail: extract original filename to prevent duplicate thumb sizes
        if (u.hostname.includes("wikimedia.org") && u.pathname.includes("/thumb/")) {
          const parts = u.pathname.split("/");
          if (parts.length >= 7) {
            return `wikimedia:${parts[parts.length - 2].toLowerCase()}`;
          }
        }
        // Generic: hostname + pathname without dimension suffixes (_300x300, etc.)
        const cleanPath = u.pathname
          .replace(/[-_]\d+x\d+(?=\.[a-zA-Z0-9]+$)/i, "")
          .replace(/[-_](?:thumb|small|medium|large)(?=\.[a-zA-Z0-9]+$)/i, "");
        return `${u.hostname}${cleanPath}`.toLowerCase();
      } catch {
        return urlStr.toLowerCase();
      }
    };

    const addCandidate = (rawUrl?: string | null, altText?: string, isPrimary = false) => {
      if (!rawUrl || typeof rawUrl !== "string") return;
      const clean = rawUrl.trim();
      if (!clean || clean.startsWith("data:") || clean.startsWith("javascript:")) return;

      // Filter out tiny icons, SVGs, tracking pixels, UI elements
      if (
        clean.endsWith(".svg") ||
        clean.includes(".svg?") ||
        clean.includes("/favicon") ||
        clean.includes("/icon-") ||
        clean.includes("/pixel") ||
        clean.includes("beacon") ||
        clean.includes("1x1") ||
        clean.includes("track") ||
        clean.includes("analytics") ||
        clean.includes("social-") ||
        clean.includes("badge")
      ) {
        return;
      }

      try {
        const resolved = new URL(clean, trimmed).href;
        const dedupeKey = getDedupeKey(resolved);

        const existing = candidateUrls.get(dedupeKey);
        if (!existing) {
          candidateUrls.set(dedupeKey, {
            url: resolved,
            altText: (altText || pageTitle).trim(),
            isPrimary,
          });
        } else if (isPrimary && !existing.isPrimary) {
          existing.isPrimary = true;
          existing.url = resolved;
        }
      } catch {
        // Ignore invalid URL candidate
      }
    };

    // 1. OpenGraph / Twitter meta images (typically highest-resolution main photo)
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) addCandidate(ogImage, pageTitle, true);

    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    if (twitterImage) addCandidate(twitterImage, pageTitle, !ogImage);

    // 2. Structured Data: Schema.org JSON-LD (<script type="application/ld+json">)
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const rawJson = $(elem).html();
        if (!rawJson) return;
        const parsed = JSON.parse(rawJson);
        const parseSchema = (obj: any) => {
          if (!obj || typeof obj !== "object") return;
          if (Array.isArray(obj)) {
            obj.forEach(parseSchema);
            return;
          }
          if (obj.image) {
            if (typeof obj.image === "string") addCandidate(obj.image, obj.name || pageTitle);
            else if (Array.isArray(obj.image)) {
              obj.image.forEach((imgItem: any) => {
                if (typeof imgItem === "string") addCandidate(imgItem, obj.name || pageTitle);
                else if (imgItem?.url) addCandidate(imgItem.url, obj.name || pageTitle);
              });
            } else if (obj.image?.url) {
              addCandidate(obj.image.url, obj.name || pageTitle);
            }
          }
          if (obj["@graph"] && Array.isArray(obj["@graph"])) {
            obj["@graph"].forEach(parseSchema);
          }
        };
        parseSchema(parsed);
      } catch {
        // Continue to other scripts
      }
    });

    // 3. Product Gallery & Image tags
    $("img").each((_, elem) => {
      const $img = $(elem);

      // Check high-res attributes often used in e-commerce zoomers
      const highRes =
        $img.attr("data-zoom-image") ||
        $img.attr("data-large-img") ||
        $img.attr("data-high-res-src") ||
        $img.attr("data-large_image") ||
        $img.attr("data-orig-file") ||
        $img.attr("data-src") ||
        $img.attr("data-lazy-src") ||
        $img.attr("src");

      const alt = $img.attr("alt") || pageTitle;

      // Check srcset for highest resolution candidate
      const srcset = $img.attr("srcset") || $img.attr("data-srcset");
      let addedFromSrcset = false;
      if (srcset) {
        const candidates = srcset
          .split(",")
          .map((part) => part.trim().split(/\s+/))
          .filter((tokens) => tokens.length >= 1 && tokens[0]);

        if (candidates.length > 0) {
          // Take the last candidate (usually largest width or 2x/3x)
          const bestCandidate = candidates[candidates.length - 1][0];
          addCandidate(bestCandidate, alt);
          addedFromSrcset = true;
        }
      }

      // Only fallback to highRes/src if not already added from higher-res srcset
      if (!addedFromSrcset && highRes) {
        addCandidate(highRes, alt);
      }
    });

    const images = Array.from(candidateUrls.values()).slice(0, 30); // Cap at 30 images
    return {
      pageTitle,
      isDirectImage: false,
      images,
    };
  }

  /**
   * Downloads selected image URLs, converts them to WebP (unless already optimal WebP),
   * uploads them directly to AWS S3, and returns the hosted URLs.
   *
   * "jo km hoga fir se compress na karega na quality khrab hoga do robust"
   * - If already WebP and <= 350KB and within maxDimension, recompression is BYPASSED
   *   to completely eliminate generation loss and preserve 100% original visual fidelity.
   * - If non-WebP (PNG/JPEG) but small (< 200KB), converted to WebP with very high quality (90)
   *   so textures and texts stay razor-sharp.
   * - If large (> 1600px or > 1MB), gracefully scaled and compressed to ~150-250KB WebP.
   */
  static async importAndUploadImages(
    items: Array<{ url: string; altText?: string }>,
    maxDimension = 1600,
    quality = 0.86
  ): Promise<{ imported: ImportedImageResult[]; errors: Array<{ url: string; error: string }> }> {
    const imported: ImportedImageResult[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        let parsed: URL;
        try {
          parsed = new URL(item.url);
        } catch {
          errors.push({ url: item.url, error: "Invalid URL string" });
          continue;
        }

        // Fetch binary with realistic headers and referer to bypass hotlink blockers
        let response = await fetch(item.url, {
          headers: {
            "User-Agent": BROWSER_USER_AGENT,
            Referer: parsed.origin,
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(15000), // 15s timeout per image
        });

        // If origin referer was rejected (e.g. 403 hotlink protection), retry without Referer
        if (!response.ok) {
          response = await fetch(item.url, {
            headers: {
              "User-Agent": BROWSER_USER_AGENT,
              Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
            signal: AbortSignal.timeout(15000),
          });
        }

        if (!response.ok) {
          errors.push({
            url: item.url,
            error: `Failed to download image (HTTP ${response.status} ${response.statusText})`,
          });
          continue;
        }

        const arrayBuf = await response.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuf);
        const originalSize = inputBuffer.length;

        // Inspect image with sharp
        const imageInstance = sharp(inputBuffer);
        const metadata = await imageInstance.metadata();
        const format = metadata.format;
        const width = metadata.width || 0;
        const height = metadata.height || 0;

        let finalBuffer: Buffer;
        let skippedRecompression = false;

        // Robust Rule: "jo km hoga fir se compress na karega na quality khrab hoga"
        // If image is ALREADY WebP under 350KB and within maxDimension, DO NOT re-compress!
        if (
          format === "webp" &&
          originalSize <= 350 * 1024 &&
          width <= maxDimension &&
          height <= maxDimension
        ) {
          finalBuffer = inputBuffer;
          skippedRecompression = true;
          logger.info(
            { url: item.url, size: originalSize, format },
            "Image is already optimized WebP. Skipping recompression to preserve 100% quality."
          );
        } else {
          // Convert to WebP
          let pipeline = sharp(inputBuffer);

          // Resize if larger than maxDimension
          if (width > maxDimension || height > maxDimension) {
            pipeline = pipeline.resize({
              width: maxDimension,
              height: maxDimension,
              fit: "inside",
              withoutEnlargement: true,
            });
          }

          // Use higher quality for sharp text and fine charts (respect caller quality if higher than default 90)
          const requestedQuality = Math.round(quality * 100);
          const targetQuality = Math.max(requestedQuality, originalSize < 200 * 1024 ? 90 : 86);

          pipeline = pipeline.webp({
            quality: targetQuality,
            effort: targetQuality >= 95 ? 5 : 4,
            smartSubsample: targetQuality < 95, // Disable chroma subsampling at 95+ for crystal clear text/lines
          });

          finalBuffer = await pipeline.toBuffer();

          // Safety check: if converting an already-compressed WebP somehow resulted in larger file, keep original
          if (format === "webp" && finalBuffer.length >= originalSize) {
            finalBuffer = inputBuffer;
            skippedRecompression = true;
          }
        }

        // Clean base name for S3 Key
        const rawFileName = parsed.pathname.split("/").pop()?.replace(/\.[^/.]+$/, "") || "product-image";
        const cleanBase = decodeURIComponent(rawFileName).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) || "product";
        const s3FileName = `${cleanBase}.webp`;

        // Upload to AWS S3
        const s3Url = await uploadBufferToS3(finalBuffer, s3FileName, "image/webp");

        imported.push({
          originalUrl: item.url,
          s3Url,
          altText: (item.altText || cleanBase.replace(/[_-]+/g, " ")).trim(),
          originalSize,
          compressedSize: finalBuffer.length,
          width: width || 0,
          height: height || 0,
          skippedRecompression,
        });
      } catch (err: any) {
        logger.error({ err, url: item.url }, "Error processing image from URL");
        errors.push({ url: item.url, error: err.message || "Failed to process image" });
      }
    }

    return { imported, errors };
  }
}
