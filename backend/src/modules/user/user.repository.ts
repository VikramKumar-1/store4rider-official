/**
 * @class UserRepository
 * @description Direct database access layer for Users.
 * Keeps Mongoose specifics completely hidden from the Service layer.
 */
import { UserModel } from "./user.model";
import { IUser } from "@store4riders/shared-types";

export class UserRepository {
  static async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id).lean().exec() as unknown as IUser | null;
  }

  static async findByIdWithPassword(id: string): Promise<any | null> {
    return UserModel.findById(id).select("+password").lean().exec();
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).lean().exec() as unknown as IUser | null;
  }

  static async findByEmailWithPassword(email: string): Promise<any | null> {
    return UserModel.findOne({ email }).select("+password").lean().exec();
  }

  static async create(data: Partial<IUser> & { password?: string }): Promise<IUser> {
    const user = new UserModel(data);
    return (await user.save()).toObject() as IUser;
  }

  static async update(id: string, data: Partial<IUser> & { password?: string }): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true, strict: false }).lean().exec() as unknown as IUser | null;
  }

  static buildUserQuery(role?: string, search?: string): any {
    const query: any = {};
    if (role === "staff") {
      query.role = { $in: ["super_admin", "admin", "logistic", "customer_care", "product_manager", "order_manager", "customer_support"] };
    } else if (role) {
      query.role = role;
    }
    if (search && search.trim()) {
      const clean = search.trim();
      const escaped = clean.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const tokens = clean.split(/\s+/).filter(Boolean);
      const digits = clean.replace(/[^0-9]/g, "");

      const searchOr: any[] = [
        { firstName: { $regex: escaped, $options: "i" } },
        { lastName: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
      ];

      if (digits.length >= 4) {
        searchOr.push({ phone: { $regex: digits, $options: "i" } });
      }

      if (tokens.length >= 2) {
        const token0 = tokens[0].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const token1 = tokens[tokens.length - 1].replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        searchOr.push({
          $and: [
            { firstName: { $regex: token0, $options: "i" } },
            { lastName: { $regex: token1, $options: "i" } },
          ],
        });
      }

      query.$or = searchOr;
    }
    return query;
  }

  static async findUsers(page: number, limit: number, role?: string, search?: string): Promise<IUser[]> {
    const query = this.buildUserQuery(role, search);
    const users = await UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec() as unknown as IUser[];

    return users.map(u => ({
      ...u,
      isActive: u.isActive !== false,
    }));
  }

  static async countUsers(role?: string, search?: string): Promise<number> {
    const query = this.buildUserQuery(role, search);
    return UserModel.countDocuments(query).exec();
  }

  static async delete(id: string): Promise<boolean> {
    const res = await UserModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
