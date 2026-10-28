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
        phone: user.phone || "",
        addresses: user.addresses || [],
      }
    };
  }

  static async login(data: LoginInput) {
    const user = await UserRepository.findByEmailWithPassword(data.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");

    if (user.isActive === false) {
      throw new UnauthorizedError("Your account has been disabled. Please contact administrator.");
    }

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
        phone: user.phone || "",
        addresses: user.addresses || [],
      }
    };
  }

  static async refreshToken(oldToken: string) {
    try {
      const decoded = verifyToken(oldToken, true);
      const user = await UserRepository.findById(decoded.userId);
      if (!user || user.isActive === false) {
        throw new UnauthorizedError("Account has been disabled");
      }
      return generateTokens(decoded.userId);
    } catch (err: any) {
      if (err instanceof UnauthorizedError) throw err;
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

    const frontendBaseUrl = (
      process.env.FRONTEND_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000"
    ).replace(/\/+$/, "");
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;
    const recipientName = (user as any).firstName || "Rider";

    const message = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; color: #1f2937;">
        <div style="background-color: #111827; padding: 20px 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 1px; margin: 0; text-transform: uppercase;">
            Store4Riders
          </h1>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Premium Motorcycle Riding Gear
          </p>
        </div>

        <div style="padding: 32px 28px;">
          <h2 style="color: #111827; font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">
            Hi ${recipientName},
          </h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
            We received a request to reset the password for your Store4Riders account (<strong>${user.email}</strong>). Click the button below to set a new password:
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #FF5429; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 2px 4px rgba(255, 84, 41, 0.2);">
              Set New Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 12px; line-height: 1.5; margin: 0 0 12px 0;">
            Button not working? You can also copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; font-size: 11px; color: #AB1509; background-color: #f9fafb; padding: 10px; border-radius: 4px; border: 1px solid #f3f4f6; margin: 0 0 24px 0;">
            <a href="${resetUrl}" style="color: #AB1509; text-decoration: underline;">${resetUrl}</a>
          </p>

          <div style="border-top: 1px solid #f3f4f6; padding-top: 16px; margin-top: 24px;">
            <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 0;">
              <strong>Note:</strong> This link is secure and will expire in <strong>60 minutes</strong>. If you did not make this request, you can safely ignore this email — your account remains completely safe.
            </p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 11px; margin: 0;">
            Need help? Contact our rider support team at <a href="mailto:support@store4riders.com" style="color: #FF5429; text-decoration: none;">support@store4riders.com</a>
          </p>
        </div>
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
