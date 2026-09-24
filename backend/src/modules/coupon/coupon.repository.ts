import { CouponModel } from "./coupon.model";
import { ICoupon } from "@store4riders/shared-types";

export class CouponRepository {
  static async create(data: Partial<ICoupon>): Promise<ICoupon> {
    const coupon = new CouponModel(data);
    return (await coupon.save()).toObject() as ICoupon;
  }

  static async findByCode(code: string): Promise<ICoupon | null> {
    return CouponModel.findOne({ code: code.toUpperCase() }).lean().exec() as unknown as ICoupon | null;
  }

  static async incrementUsage(code: string, session?: any): Promise<void> {
    await CouponModel.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usageCount: 1 } },
      { session }
    ).exec();
  }
}
