import { z } from "zod";
import { userRoleSchema } from "@store4riders/shared-validation";
import { UserRole } from "@store4riders/shared-types";
import { NextRequest } from "next/server";

export class AdminValidator {
  static validatePagination(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const role = url.searchParams.get("role") || undefined;
    
    return {
      page: isNaN(page) || page < 1 ? 1 : page,
      limit: isNaN(limit) || limit < 1 ? 20 : limit,
      role,
    };
  }

  static validateRoleUpdate(body: any): { role: UserRole } {
    const schema = z.object({
      role: userRoleSchema,
    });
    return schema.parse(body) as { role: UserRole };
  }

  static validateStatusUpdate(body: any): { isActive: boolean } {
    const schema = z.object({
      isActive: z.boolean(),
    });
    return schema.parse(body) as { isActive: boolean };
  }
}
