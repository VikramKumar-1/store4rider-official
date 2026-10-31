import { NextRequest } from "next/server";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
} from "@store4riders/shared-validation";

export class CouponValidator {
  static async validateApplyCoupon(req: NextRequest) {
    const body = await req.json();
    const validatedData = validateCouponSchema.parse(body);

    return {
      code: validatedData.code,
      items: validatedData.items,
      cartTotal: validatedData.cartTotal || body.cartTotal || 0,
    };
  }

  static async validateCreate(req: NextRequest) {
    const body = await req.json();
    const validatedData = createCouponSchema.parse(body);

    return {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      expiryDate: new Date(validatedData.expiryDate),
    };
  }

  static async validateUpdate(req: NextRequest) {
    const body = await req.json();
    const validatedData = updateCouponSchema.parse(body);

    const result: any = { ...validatedData };
    if (validatedData.startDate) {
      result.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.expiryDate) {
      result.expiryDate = new Date(validatedData.expiryDate);
    }

    return result;
  }

  static validateListQuery(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const scope = url.searchParams.get("scope") || undefined;

    return {
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
      search,
      status,
      scope,
    };
  }
}
