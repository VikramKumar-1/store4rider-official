import { NextRequest } from "next/server";
import { createBrandSchema, updateBrandSchema } from "@store4riders/shared-validation";

export class BrandValidator {
  static async validateCreate(req: NextRequest) {
    const body = await req.json();
    return createBrandSchema.parse(body);
  }

  static async validateUpdate(req: NextRequest) {
    const body = await req.json();
    return updateBrandSchema.parse(body);
  }
}
