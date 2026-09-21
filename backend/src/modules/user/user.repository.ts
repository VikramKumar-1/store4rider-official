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

  static async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).lean().exec() as unknown as IUser | null;
  }

  static async findUsers(page: number, limit: number, role?: string): Promise<IUser[]> {
    const query = role ? { role } : {};
    return UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec() as unknown as IUser[];
  }

  static async countUsers(role?: string): Promise<number> {
    const query = role ? { role } : {};
    return UserModel.countDocuments(query).exec();
  }
}
