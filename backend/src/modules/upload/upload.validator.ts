import { NextRequest } from "next/server";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { AppError } from "../../core/errors/AppError";

/**
 * @class UploadValidator
 * @description Extracts and strictly validates incoming JSON payloads for file uploads.
 */
export class UploadValidator {
  
  static async validatePresignedUrl(req: NextRequest) {
    extractUserFromAuth(req);

    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      throw new AppError("fileName and fileType are required", 400);
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(fileType)) {
      throw new AppError("Invalid file type. Only jpg, png, and webp are allowed.", 400);
    }

    return { fileName, fileType };
  }
}
