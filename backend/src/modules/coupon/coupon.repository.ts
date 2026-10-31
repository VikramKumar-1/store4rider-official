import { CouponModel } from "./coupon.model";
import { ICoupon } from "@store4riders/shared-types";
import { ClientSession } from "mongoose";

export class CouponRepository {
  static async create(data: Partial<ICoupon>): Promise<ICoupon> {
    const coupon = new CouponModel(data);
    const saved = await coupon.save();
    return saved.toObject() as ICoupon;
  }

  static async findByCode(code: string): Promise<ICoupon | null> {
    return CouponModel.findOne({ code: code.toUpperCase().trim() }).lean().exec() as unknown as ICoupon | null;
  }

  static async findById(id: string): Promise<ICoupon | null> {
    return CouponModel.findById(id).lean().exec() as unknown as ICoupon | null;
  }

  static async findAll(
    filter: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: ICoupon[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CouponModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as unknown as Promise<ICoupon[]>,
      CouponModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  static async update(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
    return CouponModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).lean().exec() as unknown as ICoupon | null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await CouponModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  static async incrementUsage(code: string, session?: ClientSession): Promise<void> {
    await CouponModel.updateOne(
      { code: code.toUpperCase().trim() },
      { $inc: { usageCount: 1 } },
      { session: session || undefined }
    ).exec();
  }

  static async decrementUsage(code: string, session?: ClientSession): Promise<void> {
    await CouponModel.updateOne(
      { code: code.toUpperCase().trim(), usageCount: { $gt: 0 } },
      { $inc: { usageCount: -1 } },
      { session: session || undefined }
    ).exec();
  }
}
