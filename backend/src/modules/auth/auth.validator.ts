import { NextRequest } from "next/server";
import { registerSchema, loginSchema } from "@store4riders/shared-validation";

/**
 * AuthValidator
 * 
 * Handles extracting JSON payloads from incoming authentication requests
 * and strictly validating them against Zod schemas.
 */
export class AuthValidator {
  
  /**
   * Validates the registration payload.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<any>} The parsed and validated registration data.
   * @throws Will throw if data is invalid.
   */
  static async validateRegister(req: NextRequest) {
    const body = await req.json();
    return registerSchema.parse(body);
  }

  /**
   * Validates the login payload.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<any>} The parsed and validated login data.
   * @throws Will throw if data is invalid.
   */
  static async validateLogin(req: NextRequest) {
    const body = await req.json();
    return loginSchema.parse(body);
  }
}
