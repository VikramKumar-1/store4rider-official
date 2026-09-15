import { NextRequest } from "next/server";
import { UploadService } from "./upload.service";
import { UploadValidator } from "./upload.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class UploadController
 * @description Minimal HTTP controller for File Uploads.
 * Responsibilities:
 * 1. Extract and validate payloads via UploadValidator.
 * 2. Delegate to UploadService.
 * 3. Return standardized API responses.
 */
export class UploadController {
  
  static async getPresignedUrl(req: NextRequest) {
    const { fileName, fileType } = await UploadValidator.validatePresignedUrl(req);
    const url = await UploadService.generatePresignedUrl(fileName, fileType);
    return ApiResponse.success({ url }, "Presigned URL generated successfully");
  }
}
