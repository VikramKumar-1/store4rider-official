import { getPresignedUrl } from "../../core/storage/s3";

/**
 * @class UploadService
 * @description Core business logic for handling file uploads (S3).
 * Highlights:
 * - Secures direct-to-S3 uploads by generating pre-signed URLs.
 */
export class UploadService {
  
  static async generatePresignedUrl(fileName: string, fileType: string): Promise<string> {
    return await getPresignedUrl(fileName, fileType);
  }
}
