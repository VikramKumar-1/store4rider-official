import { CartModel } from "./cart.model";
import { ICart } from "@store4riders/shared-types";

export class CartRepository {
  static async findByUserId(userId: string): Promise<ICart | null> {
    return CartModel.findOne({ userId }).lean().exec() as unknown as ICart | null;
  }

  static async upsert(userId: string, data: Partial<ICart>): Promise<ICart> {
    const { _id, createdAt, updatedAt, __v, ...cleanData } = data as any;
    return CartModel.findOneAndUpdate(
      { userId },
      { $set: cleanData },
      { new: true, upsert: true }
    ).lean().exec() as unknown as ICart;
  }

  static async clear(userId: string, session?: any): Promise<void> {
    await CartModel.findOneAndDelete({ userId }, { session }).exec();
  }
}
