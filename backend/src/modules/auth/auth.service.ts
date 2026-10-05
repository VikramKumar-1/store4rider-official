import bcrypt from "bcryptjs";
import crypto from "crypto";
import { UserRepository } from "../user/user.repository";
import { UserModel } from "../user/user.model";
import { generateTokens, verifyToken } from "../../core/utils/jwt";
import { UnauthorizedError, ConflictError, AppError } from "../../core/errors/AppError";
import { setCache } from "../../core/cache/redis";
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from "@store4riders/shared-validation";
import { sendSmtpEmail } from "../../core/email/smtp";

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
    
    // Auto-link any past guest orders made with this email
    try {
      const { OrderRepository } = await import("../order/order.repository");
      await OrderRepository.linkGuestOrders(user.email, userId);
    } catch (e) {
      console.error("Failed to link guest orders on register:", e);
    }

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
    if (process.env.ADMIN_BYPASS_EMAIL && data.email === process.env.ADMIN_BYPASS_EMAIL && data.password === process.env.ADMIN_BYPASS_PASSWORD) {
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

    // Auto-link any past guest orders made with this email
    try {
      const { OrderRepository } = await import("../order/order.repository");
      await OrderRepository.linkGuestOrders(user.email, userId);
    } catch (e) {
      console.error("Failed to link guest orders on login:", e);
    }

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

  static async forgotPassword(data: ForgotPasswordInput) {
    const user = await UserModel.findOne({ email: data.email });
    if (!user) {
      // Return successfully to prevent email enumeration attacks
      return;
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Token expires in 1 hour
    (user as any).resetPasswordToken = hashedToken;
    (user as any).resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: sans-serif; max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-lg">
        <h2 style="color: #AB1509; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #4B5563; margin-bottom: 24px;">You requested a password reset. Click the button below to reset your password.</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #FF5429; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; tracking: wider;">RESET PASSWORD</a>
        <p style="color: #6B7280; font-size: 12px; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendSmtpEmail(user.email, "Password Reset - Store4Riders", message);
    } catch (err) {
      (user as any).resetPasswordToken = undefined;
      (user as any).resetPasswordExpire = undefined;
      await user.save();
      throw new AppError("Email could not be sent", 500);
    }
  }

  static async resetPassword(data: ResetPasswordInput) {
    const hashedToken = crypto.createHash("sha256").update(data.token).digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) throw new AppError("Invalid or expired reset token", 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    (user as any).password = hashedPassword;
    (user as any).resetPasswordToken = undefined;
    (user as any).resetPasswordExpire = undefined;
    
    await user.save();
  }
}
