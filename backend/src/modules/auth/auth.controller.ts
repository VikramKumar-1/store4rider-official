import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../core/response/ApiResponse";
import { AuthValidator } from "./auth.validator";

const isProd = process.env.NODE_ENV === "production";

const setCookies = (res: NextResponse, accessToken: string, refreshToken: string) => {
  res.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  res.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
};

const clearCookies = (res: NextResponse) => {
  res.cookies.set("accessToken", "", {
    maxAge: 0,
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
  });
  res.cookies.set("refreshToken", "", {
    maxAge: 0,
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "strict" : "lax",
  });
};

/**
 * @class AuthController
 * @description Minimal HTTP controller for Authentication.
 * Responsibilities:
 * 1. Validate payloads via AuthValidator.
 * 2. Delegate to AuthService for business logic and JWT generation.
 * 3. Securely attach tokens to `httpOnly` cookies before returning the response.
 */
export class AuthController {
  
  static async register(req: NextRequest) {
    const validatedData = await AuthValidator.validateRegister(req);
    const result = await AuthService.register(validatedData);
    
    // Return tokens and user in data payload for mobile apps / frontend, while also setting cookies for web
    const res = ApiResponse.success({ 
      accessToken: result.tokens.accessToken, 
      refreshToken: result.tokens.refreshToken,
      user: result.user 
    }, "Registered successfully", 201);
    setCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return res;
  }

  static async login(req: NextRequest) {
    const validatedData = await AuthValidator.validateLogin(req);
    const result = await AuthService.login(validatedData);

    const res = ApiResponse.success({ 
      accessToken: result.tokens.accessToken, 
      refreshToken: result.tokens.refreshToken,
      user: result.user 
    }, "Logged in successfully");
    setCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return res;
  }

  static async refresh(req: NextRequest) {
    let oldRefreshToken = req.cookies.get("refreshToken")?.value;
    if (!oldRefreshToken) {
      try {
        const body = await req.json();
        oldRefreshToken = body?.refreshToken;
      } catch (e) {}
    }

    if (!oldRefreshToken) return ApiResponse.error("No refresh token", 401);

    const tokens = await AuthService.refreshToken(oldRefreshToken);
    
    const res = ApiResponse.success({ 
      accessToken: tokens.accessToken, 
      refreshToken: tokens.refreshToken 
    }, "Token refreshed");
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return res;
  }

  static async logout(req: NextRequest) {
    try {
      const { extractUserFromAuth } = await import("../../core/middlewares/auth");
      const userId = extractUserFromAuth(req);
      if (userId) {
        await AuthService.logout(userId);
      }
    } catch {
      // Session may already be expired, proceed to clear cookies
    }

    const refreshToken = req.cookies.get("refreshToken")?.value;
    if (refreshToken) {
      try {
        const { setCache } = await import("../../core/cache/redis");
        await setCache(`bl_token_${refreshToken}`, "1", 30 * 24 * 60 * 60);
      } catch {}
    }

    const res = ApiResponse.success(null, "Logged out successfully");
    clearCookies(res);
    return res;
  }

  static async forgotPassword(req: NextRequest) {
    const validatedData = await AuthValidator.validateForgotPassword(req);
    await AuthService.forgotPassword(validatedData);
    return ApiResponse.success(null, "If an account exists with that email, a reset link has been sent");
  }

  static async resetPassword(req: NextRequest) {
    const validatedData = await AuthValidator.validateResetPassword(req);
    await AuthService.resetPassword(validatedData);
    return ApiResponse.success(null, "Password reset successfully");
  }

  static async checkEmail(req: NextRequest) {
    try {
      const body = await req.json();
      const email = body?.email?.toLowerCase()?.trim();
      if (!email) {
        return ApiResponse.error("Email is required", 400);
      }
      
      const { UserModel } = await import("../user/user.model");
      const user = await UserModel.findOne({ email }).select("_id").lean().exec();
      
      return ApiResponse.success({ exists: !!user }, "Email checked successfully");
    } catch (e: any) {
      return ApiResponse.error("Failed to check email", 500);
    }
  }
}
