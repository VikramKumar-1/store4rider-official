import { NextRequest } from "next/server";
import { UserService } from "./user.service";
import { UserValidator } from "./user.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @class UserController
 * @description Minimal HTTP controller for User profiles and addresses.
 * Responsibilities:
 * 1. Extract and validate payloads via UserValidator.
 * 2. Delegate to UserService.
 * 3. Return standardized API responses.
 */
export class UserController {
  
  static async getProfile(req: NextRequest) {
    const userId = UserValidator.extractUserId(req);
    const user = await UserService.getProfile(userId);
    return ApiResponse.success(user, "Profile fetched successfully");
  }

  static async updateProfile(req: NextRequest) {
    const { userId, data } = await UserValidator.validateUpdateProfile(req);
    const user = await UserService.updateProfile(userId, data);
    return ApiResponse.success(user, "Profile updated successfully");
  }

  static async addAddress(req: NextRequest) {
    const { userId, data } = await UserValidator.validateAddAddress(req);
    const user = await UserService.addAddress(userId, data);
    return ApiResponse.success(user, "Address added successfully");
  }
}
