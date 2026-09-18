import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../utils/logger";

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
  logger.warn("AWS S3 credentials missing. Uploads will mock.");
}

/**
 * Generates a pre-signed URL for direct browser uploads to S3.
 */
export const getPresignedUrl = async (fileName: string, fileType: string): Promise<string> => {
  if (!s3Client) {
    logger.warn(`Mocking presigned URL for ${fileName}`);
    return `https://mock-s3-url.com/${fileName}`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: `uploads/${Date.now()}-${fileName}`,
    ContentType: fileType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
