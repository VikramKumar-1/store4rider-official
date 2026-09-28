import { NextRequest } from "next/server";
import { AppError } from "../../core/errors/AppError";
import { createReturnSchema, qcInwardSchema } from "@store4riders/shared-validation";

export class ReturnValidator {
  
  static async validateCreateReturn(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON body", 400);
    }
    const parsed = createReturnSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("Validation Error: " + parsed.error.errors.map(e => e.message).join(", "), 400);
    }
    return parsed.data;
  }

  static async validateQCInward(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON body", 400);
    }
    const parsed = qcInwardSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("Validation Error: " + parsed.error.errors.map(e => e.message).join(", "), 400);
    }
    return parsed.data;
  }
}
