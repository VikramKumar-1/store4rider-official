import { NextRequest } from "next/server";
import { PincodeRepository } from "./pincode.repository";
import { ApiResponse } from "../../core/response/ApiResponse";
import { NotFoundError } from "../../core/errors/AppError";

export class PincodeController {
  static async getPincodeDetails(req: NextRequest, pincode: string) {
    const data = await PincodeRepository.findByPincode(pincode);
    if (!data) {
      throw new NotFoundError("Pincode not found");
    }
    
    return ApiResponse.success(data, "Pincode details fetched successfully");
  }
}
