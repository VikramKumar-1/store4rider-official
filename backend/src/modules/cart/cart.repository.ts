import { CartModel } from "./cart.model";
import { ICart } from "@store4riders/shared-types";

export class CartRepository {
  static async findByUserId(userId: string): Promise<ICart | null> {
    return CartModel.findOne({ userId }).lean().exec() as unknown as ICart | null;
  }

  static async upsert(userId: string, data: Partial<ICart>): Promise<ICart> {
    return CartModel.findOneAndUpdate(
      { userId },
      { $set: data },
      { new: true, upsert: true }
    ).lean().exec() as unknown as ICart;
  }

  static async clear(userId: string, session?: any): Promise<void> {
    await CartModel.findOneAndDelete({ userId }, { session }).exec();
  }
}
