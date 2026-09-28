import { NextRequest } from "next/server";
import { createShipmentSchema, updateShipmentStatusSchema, getRatesSchema, serviceabilitySchema } from "@store4riders/shared-validation";
import { AppError, ValidationError } from "../../core/errors/AppError";

export class ShipmentValidator {
  static async validateCreate(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }
    const result = createShipmentSchema.safeParse({ body });
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e: any) => e.message).join(", "));
    }
    return result.data.body;
  }

  static async validateServiceability(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }
    const result = serviceabilitySchema.safeParse({ body });
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e: any) => e.message).join(", "));
    }
    return result.data.body;
  }

  static async validateGetRates(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }
    const result = getRatesSchema.safeParse({ body });
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e: any) => e.message).join(", "));
    }
    return result.data.body;
  }

  static async validateStatusUpdate(req: NextRequest, id: string) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }
    const result = updateShipmentStatusSchema.safeParse({ params: { id }, body });
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e: any) => e.message).join(", "));
    }
    return { id: result.data.params.id, status: result.data.body.status };
  }
}
