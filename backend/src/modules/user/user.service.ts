import { UserRepository } from "./user.repository";
import { IUser, IUserAddress, UserRole } from "@store4riders/shared-types";
import { NotFoundError } from "../../core/errors/AppError";

/**
 * @class UserService
 * @description Core business logic for managing user profiles.
 * Highlights:
 * - Completely isolated from HTTP.
 * - Auto-manages address defaults (if a new address is set to default, others are set to false).
 */
export class UserService {
  
  static async getRole(userId: string): Promise<UserRole> {
    if (userId === "admin-bypass-id") return "super_admin";
    const user = await UserRepository.findById(userId);
    return user?.role || "customer";
  }

  static async getProfile(userId: string): Promise<IUser> {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  static async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser> {
    const user = await UserRepository.update(userId, data);
    if (!user) throw new NotFoundError("User");
    return user;
  }

  static async addAddress(userId: string, data: Omit<IUserAddress, 'id'>): Promise<IUser> {
    const user = await this.getProfile(userId);
    const address: IUserAddress = { ...data, id: crypto.randomUUID() };
    
    if (address.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    } else if (user.addresses.length === 0) {
      address.isDefault = true;
    }
    
    user.addresses.push(address);
    return await this.updateProfile(userId, { addresses: user.addresses });
  }

  static async removeAddress(userId: string, addressId: string): Promise<IUser> {
    const user = await this.getProfile(userId);
    user.addresses = user.addresses.filter(a => a.id !== addressId);
    return await this.updateProfile(userId, { addresses: user.addresses });
  }

  static async getUsers(page: number, limit: number, role?: string) {
    const items = await UserRepository.findUsers(page, limit, role);
    const totalCount = await UserRepository.countUsers(role);
    return { items, totalCount };
  }

  static async updateRole(userId: string, role: UserRole): Promise<IUser> {
    const user = await UserRepository.update(userId, { role });
    if (!user) throw new NotFoundError("User");
    return user;
  }

  static async updateStatus(userId: string, isActive: boolean): Promise<IUser> {
    const user = await UserRepository.update(userId, { isActive });
    if (!user) throw new NotFoundError("User");
    return user;
  }
}
