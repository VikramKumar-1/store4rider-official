import { UserRepository } from "./user.repository";
import { IUser, IUserAddress, UserRole } from "@store4riders/shared-types";
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from "../../core/errors/AppError";

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

  static async changePassword(userId: string, currentPass: string, newPass: string): Promise<void> {
    const user = await UserRepository.findByIdWithPassword(userId);
    if (!user) throw new NotFoundError("User");

    if (!user.password) {
      throw new ValidationError("Account does not have a local password configured");
    }

    const bcrypt = await import("bcryptjs");
    const isMatch = await bcrypt.compare(currentPass, user.password);
    if (!isMatch) {
      throw new ValidationError("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPass, 12);
    await UserRepository.update(userId, { password: hashedPassword });
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

  static async updateAddress(userId: string, addressId: string, data: Partial<IUserAddress>): Promise<IUser> {
    const user = await this.getProfile(userId);
    const idx = user.addresses.findIndex(a => a.id === addressId || String((a as any)._id) === addressId);
    if (idx === -1) throw new NotFoundError("Address");
    
    if (data.isDefault) {
      user.addresses.forEach(a => (a.isDefault = false));
    }
    
    user.addresses[idx] = {
      ...user.addresses[idx],
      ...data,
      id: user.addresses[idx].id || addressId,
    };
    
    return await this.updateProfile(userId, { addresses: user.addresses });
  }

  static async removeAddress(userId: string, addressId: string): Promise<IUser> {
    const user = await this.getProfile(userId);
    user.addresses = user.addresses.filter(a => a.id !== addressId && String((a as any)._id) !== addressId);
    return await this.updateProfile(userId, { addresses: user.addresses });
  }

  static async getUsers(page: number, limit: number, role?: string, search?: string) {
    const items = await UserRepository.findUsers(page, limit, role, search);
    const totalCount = await UserRepository.countUsers(role, search);
    return { items, totalCount };
  }

  static async createStaffUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    role: UserRole;
  }, requestingUserId?: string): Promise<IUser> {
    const existing = await UserRepository.findByEmail(data.email.toLowerCase().trim());
    if (existing) {
      throw new ConflictError("User with this email already exists");
    }

    if (data.role === "admin" || data.role === "super_admin") {
      if (requestingUserId) {
        const reqRole = await this.getRole(requestingUserId);
        if (reqRole !== "super_admin" && reqRole !== "admin") {
          throw new ForbiddenError("Only Administrators can create Admin users");
        }
      }
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(data.password, 12);

    return await UserRepository.create({
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: data.firstName.trim(),
      lastName: (data.lastName || "").trim(),
      phone: data.phone?.trim(),
      role: data.role,
      isActive: true,
      addresses: [],
    });
  }

  static async updateRole(userId: string, role: UserRole, requestingUserId?: string): Promise<IUser> {
    const targetUser = await UserRepository.findById(userId);
    if (!targetUser) throw new NotFoundError("User");

    if (requestingUserId) {
      const reqRole = await this.getRole(requestingUserId);
      if (targetUser.role === "super_admin" && reqRole !== "super_admin") {
        throw new ForbiddenError("Only Super Admin can modify Super Admin roles");
      }
      if (targetUser.role === "admin" && reqRole !== "super_admin") {
        throw new ForbiddenError("Only Super Admin can demote or modify existing Admin accounts");
      }
      if (role === "super_admin" && reqRole !== "super_admin") {
        throw new ForbiddenError("Only Super Admin can assign Super Admin role");
      }
      if (role === "admin" && reqRole !== "super_admin" && reqRole !== "admin") {
        throw new ForbiddenError("Only Administrators can assign Admin role");
      }
    }

    const user = await UserRepository.update(userId, { role });
    if (!user) throw new NotFoundError("User");
    return user;
  }

  static async updateStatus(userId: string, isActive: boolean, requestingUserId?: string): Promise<IUser> {
    const targetUser = await UserRepository.findById(userId);
    if (!targetUser) throw new NotFoundError("User");

    if (targetUser.role === "super_admin") {
      throw new ForbiddenError("Super Admin status cannot be modified");
    }

    if (requestingUserId) {
      const reqRole = await this.getRole(requestingUserId);
      if (targetUser.role === "admin" && reqRole !== "super_admin") {
        throw new ForbiddenError("Only Super Admin can enable or disable Admin accounts");
      }
    }

    const user = await UserRepository.update(userId, { isActive });
    if (!user) throw new NotFoundError("User");
    return user;
  }

  static async deleteUser(userId: string, requestingUserId: string): Promise<boolean> {
    const targetUser = await UserRepository.findById(userId);
    if (!targetUser) throw new NotFoundError("User");

    if (userId === requestingUserId) {
      throw new ForbiddenError("You cannot delete your own account");
    }

    if (targetUser.role === "super_admin") {
      throw new ForbiddenError("Super Admin accounts cannot be deleted");
    }

    const reqRole = await this.getRole(requestingUserId);
    if (targetUser.role === "admin" && reqRole !== "super_admin") {
      throw new ForbiddenError("Only Super Admin can delete Admin accounts");
    }

    return await UserRepository.delete(userId);
  }
}
