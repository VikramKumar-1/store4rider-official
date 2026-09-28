import { NextRequest } from "next/server";
import { ApiResponse } from "../../core/response/ApiResponse";
import { AppError } from "../../core/errors/AppError";
import { ReturnService } from "./return.service";
import { ReturnValidator } from "./return.validator";
import { ReturnModel } from "./return.model";

export class ReturnController {
  
  // ---------------------------------------------------------------------------
  // Customer Routes
  // ---------------------------------------------------------------------------
  
  static async requestReturn(req: NextRequest) {
    const data = await ReturnValidator.validateCreateReturn(req);
    // User validation assumes `extractUserFromAuth` middleware has run
    const userId = req.headers.get("x-user-id");
    
    if (!userId) {
      throw new AppError("Unauthorized. Please log in.", 401);
    }

    const result = await ReturnService.createReturnRequest({ ...data, userId });
    return ApiResponse.success(result, "Return request created successfully", 201);
  }

  // ---------------------------------------------------------------------------
  // Admin Routes
  // ---------------------------------------------------------------------------
  
  static async inwardScan(req: NextRequest, id: string) {
    // Basic barcode scan just hits this endpoint with the Return ID
    const result = await ReturnService.inwardScanQC(id);
    return ApiResponse.success(result, "Package inwarded successfully. 48-hour SLA started.");
  }

  static async processQC(req: NextRequest, id: string) {
    const data = await ReturnValidator.validateQCInward(req);
    const result = await ReturnService.processQCResult(
      id, 
      data.action, 
      data.qcNotes, 
      data.customRefundAmount
    );
    return ApiResponse.success(result, "QC processed successfully");
  }

  static async getAdminReturns(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const courierDispute = searchParams.get("courierDispute");

    const query: any = {};
    if (status) query.status = status;
    if (courierDispute === "true") query.courierDispute = true;

    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      ReturnModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      ReturnModel.countDocuments(query).exec(),
    ]);

    return ApiResponse.paginated(items, totalCount, page, limit);
  }
}
