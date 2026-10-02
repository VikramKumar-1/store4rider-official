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

  static async getDistinctStates(req: NextRequest) {
    const states = await PincodeRepository.getDistinctStates();
    
    // Sort alphabetically and title case them to look nice in UI
    const formattedStates = states
      .map(state => state.trim().toLowerCase().replace(/\b\w/g, s => s.toUpperCase()))
      .sort((a, b) => a.localeCompare(b));
      
    // Remove duplicates that might arise from formatting
    const uniqueStates = [...new Set(formattedStates)];

    return ApiResponse.success(uniqueStates, "States fetched successfully");
  }
}
