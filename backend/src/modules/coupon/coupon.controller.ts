import { NextRequest } from "next/server";
import { CouponService } from "./coupon.service";
import { CouponValidator } from "./coupon.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

export class CouponController {
  static async validate(req: NextRequest, userId?: string) {
    const { code, items, cartTotal } = await CouponValidator.validateApplyCoupon(req);
    const result = await CouponService.validateCoupon({
      code,
      items,
      cartTotal,
      userId,
    });
    return ApiResponse.success(result, result.message);
  }

  static async list(req: NextRequest) {
    const query = CouponValidator.validateListQuery(req);
    const { items, total, page, limit } = await CouponService.listCoupons(query);
    return ApiResponse.paginated(items, total, page, limit);
  }

  static async getById(req: NextRequest, id: string) {
    const coupon = await CouponService.getCouponById(id);
    return ApiResponse.success(coupon, "Coupon details fetched successfully");
  }

  static async create(req: NextRequest) {
    const data = await CouponValidator.validateCreate(req);
    const coupon = await CouponService.createCoupon(data as any);
    return ApiResponse.success(coupon, "Coupon created successfully", 201);
  }

  static async update(req: NextRequest, id: string) {
    const data = await CouponValidator.validateUpdate(req);
    const coupon = await CouponService.updateCoupon(id, data as any);
    return ApiResponse.success(coupon, "Coupon updated successfully");
  }

  static async delete(req: NextRequest, id: string) {
    await CouponService.deleteCoupon(id);
    return ApiResponse.success({ id }, "Coupon deleted successfully");
  }
}
