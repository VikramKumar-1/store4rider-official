import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";
import fs from "fs";
import path from "path";

const REGION = process.env.AWS_REGION || process.env.S3_REGION || "ap-south-2";
const BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || "store4riders";
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

let s3Client: S3Client | null = null;

if (ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
} else {
  logger.warn("AWS S3 credentials missing. Direct uploads will use local self-hosted storage.");
}

/**
 * Generates a pre-signed URL for direct browser uploads to S3.
 */
export const getPresignedUrl = async (fileName: string, fileType: string): Promise<string> => {
  if (!s3Client) {
    throw new AppError("AWS S3 credentials are not configured", 500);
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `uploads/${Date.now()}-${fileName}`,
    ContentType: fileType,
    CacheControl: "public, max-age=31536000, immutable",
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

/**
 * Directly uploads a binary buffer to S3 or local self-hosted public storage.
 * Ensures images are 100% saved on Store4Riders infrastructure with zero broken links.
 */
export const uploadBufferToS3 = async (
  buffer: Buffer,
  fileName: string,
  contentType = "image/webp"
): Promise<string> => {
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniquePrefix = Date.now();
  const fileKey = `${uniquePrefix}-${cleanName}`;
  const s3Key = `uploads/${fileKey}`;

  // 1. Try AWS S3 if credentials are active
  if (s3Client) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      });

      await s3Client.send(command);
      const cdnBase = process.env.CDN_URL?.trim() || process.env.NEXT_PUBLIC_CDN_URL?.trim() || "https://d2zuvpvc0pfkya.cloudfront.net";
      return `${cdnBase}/${s3Key}`;
    } catch (err: any) {
      logger.warn({ err: err.message }, "S3 direct upload failed; saving to self-hosted local public storage");
    }
  }

  // 2. Self-hosted storage fallback: saves to frontend/public/uploads/
  try {
    const uploadsDir = path.resolve(process.cwd(), "..", "frontend", "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const localFilePath = path.join(uploadsDir, fileKey);
    fs.writeFileSync(localFilePath, buffer);
    return `/uploads/${fileKey}`;
  } catch (localErr: any) {
    logger.error({ localErr }, "Failed to write image buffer to local uploads directory");
    throw new AppError("Failed to save image on server storage", 500);
  }
};
