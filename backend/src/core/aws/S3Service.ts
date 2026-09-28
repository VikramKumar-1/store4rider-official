import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export class S3Service {
  /**
   * Uploads a file buffer to S3 and returns the public URL.
   */
  static async uploadFile(file: { buffer: Buffer; originalname: string; mimetype: string }, folder: string = "uploads"): Promise<string> {
    const bucketName = process.env.AWS_S3_BUCKET;
    if (!bucketName) {
      throw new Error("AWS_S3_BUCKET is not configured");
    }

    const key = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: "public-read", // Omitted as modern S3 buckets disable ACLs by default
    });

    await s3Client.send(command);

    // Return the public URL
    return `https://${bucketName}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com/${key}`;
  }
}
