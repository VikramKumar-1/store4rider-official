import bcrypt from "bcryptjs";
import { UserRepository } from "../user/user.repository";
import { generateTokens, verifyToken } from "../../core/utils/jwt";
import { UnauthorizedError, ConflictError } from "../../core/errors/AppError";
import { setCache } from "../../core/cache/redis";
import { RegisterInput, LoginInput } from "@store4riders/shared-validation";

/**
 * @class AuthService
 * @description Core business logic for user authentication.
 * Handles bcrypt password hashing, credential verification, JWT generation, 
 * and secure token refresh flows. Interacts with UserRepository.
 */
export class AuthService {
  
  static async register(data: RegisterInput) {
    const existing = await UserRepository.findByEmail(data.email);
    if (existing) throw new ConflictError("Email already in use");

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await UserRepository.create({ ...data, password: hashedPassword });
    const userId = (user as any)._id?.toString() || user.id;
    const tokens = generateTokens(userId);
    
    return {
      tokens,
      user: {
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: user.role || "customer",
      }
    };
  }

  static async login(data: LoginInput) {
    // SECURITY CRITICAL: Admin bypass must ONLY work in local development!
    if (process.env.NODE_ENV !== "production" && process.env.ADMIN_BYPASS_EMAIL && data.email === process.env.ADMIN_BYPASS_EMAIL && data.password === process.env.ADMIN_BYPASS_PASSWORD) {
      const tokens = generateTokens("admin-bypass-id");
      return {
        tokens,
        user: {
          id: "admin-bypass-id",
          email: data.email,
          firstName: "Admin",
          lastName: "Bypass",
          name: "Admin Bypass",
          role: "admin",
        }
      };
    }

    const user = await UserRepository.findByEmailWithPassword(data.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedError("Invalid credentials");

    const userId = (user as any)._id?.toString() || user.id;
    const tokens = generateTokens(userId);

    return {
      tokens,
      user: {
        id: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: user.role || "customer",
      }
    };
  }

  static async refreshToken(oldToken: string) {
    try {
      const decoded = verifyToken(oldToken, true);
      return generateTokens(decoded.userId);
    } catch (err) {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  static async logout(userId: string) {
    // Blacklist refresh tokens in Redis
    await setCache(`blacklist:${userId}`, "true", 7 * 24 * 60 * 60);
  }
}
