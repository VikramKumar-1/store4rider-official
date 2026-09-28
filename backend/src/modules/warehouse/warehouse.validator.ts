import { NextRequest } from "next/server";
import { createWarehouseSchema, updateWarehouseSchema } from "@store4riders/shared-validation";
import { AppError, ValidationError } from "../../core/errors/AppError";

export class WarehouseValidator {
  static async validateCreate(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }
    const result = createWarehouseSchema.safeParse({ body });
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e: any) => e.message).join(", "));
    }
    return result.data.body;
  }

  static async validateUpdate(req: NextRequest, id: string) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }
    const result = updateWarehouseSchema.safeParse({ params: { id }, body });
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e: any) => e.message).join(", "));
    }
    return { id: result.data.params.id, data: result.data.body };
  }
}
