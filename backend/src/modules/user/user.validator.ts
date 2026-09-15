import { NextRequest } from "next/server";
import { updateProfileSchema, addressSchema } from "@store4riders/shared-validation";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { IUser, IUserAddress } from "@store4riders/shared-types";

/**
 * @class UserValidator
 * @description Extracts and validates user context and payloads for User operations.
 */
export class UserValidator {
  
  static async validateUpdateProfile(req: NextRequest): Promise<{ userId: string; data: Partial<IUser> }> {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = updateProfileSchema.parse(body) as Partial<IUser>;
    return { userId, data };
  }

  static async validateAddAddress(req: NextRequest): Promise<{ userId: string; data: Omit<IUserAddress, 'id'> }> {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = addressSchema.parse(body) as Omit<IUserAddress, 'id'>;
    return { userId, data };
  }

  static extractUserId(req: NextRequest): string {
    return extractUserFromAuth(req);
  }
}
