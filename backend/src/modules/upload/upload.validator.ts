import { NextRequest } from "next/server";
import { z } from "zod";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { AppError } from "../../core/errors/AppError";

const isValidHttpUrl = (val: string) => {
  if (!val || typeof val !== "string") return false;
  try {
    const u = new URL(val.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const presignedUrlSchema = z.object({
  fileName: z.string().min(1, "fileName is required"),
  fileType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]),
});

const scrapeUrlSchema = z.object({
  url: z.string().trim().refine(isValidHttpUrl, "A valid HTTP or HTTPS URL is required"),
});

const importFromUrlSchema = z.object({
  items: z
    .array(
      z.object({
        url: z.string().trim().refine(isValidHttpUrl, "Valid HTTP or HTTPS image URL required"),
        altText: z.string().optional(),
      })
    )
    .min(1, "At least one image URL must be provided")
    .max(50, "Maximum 50 images can be imported at once"),
  maxDimension: z.number().int().min(400).max(3000).optional().default(1600),
  quality: z.number().min(0.5).max(1.0).optional().default(0.86),
});

/**
 * @class UploadValidator
 * @description Extracts and strictly validates incoming JSON payloads for file uploads and URL scraping/imports.
 */
export class UploadValidator {
  static async validatePresignedUrl(req: NextRequest) {
    extractUserFromAuth(req);

    const body = await req.json().catch(() => ({}));
    const parsed = presignedUrlSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message || "Invalid presigned URL request", 400);
    }

    return parsed.data;
  }

  static async validateScrapeUrl(req: NextRequest) {
    extractUserFromAuth(req);

    const body = await req.json().catch(() => ({}));
    const parsed = scrapeUrlSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message || "A valid webpage or image URL is required", 400);
    }

    return parsed.data;
  }

  static async validateImportFromUrl(req: NextRequest) {
    extractUserFromAuth(req);

    const body = await req.json().catch(() => ({}));
    const parsed = importFromUrlSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError(parsed.error.errors[0]?.message || "Invalid import request", 400);
    }

    return parsed.data;
  }
}
