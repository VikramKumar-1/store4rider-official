import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../core/response/ApiResponse";
import { AuthValidator } from "./auth.validator";

const isProd = process.env.NODE_ENV === "production";

const setCookies = (res: NextResponse, accessToken: string, refreshToken: string) => {
  res.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60, // 15 mins
  });
  res.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
};

const clearCookies = (res: NextResponse) => {
  res.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
  res.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
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
    const res = ApiResponse.success({ accessToken: result.tokens.accessToken, user: result.user }, "Registered successfully", 201);
    setCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return res;
  }

  static async login(req: NextRequest) {
    const validatedData = await AuthValidator.validateLogin(req);
    const result = await AuthService.login(validatedData);

    const res = ApiResponse.success({ accessToken: result.tokens.accessToken, user: result.user }, "Logged in successfully");
    setCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return res;
  }

  static async refresh(req: NextRequest) {
    const oldRefreshToken = req.cookies.get("refreshToken")?.value;
    if (!oldRefreshToken) return ApiResponse.error("No refresh token", 401);

    const tokens = await AuthService.refreshToken(oldRefreshToken);
    
    const res = ApiResponse.success({ accessToken: tokens.accessToken }, "Token refreshed");
    setCookies(res, tokens.accessToken, tokens.refreshToken);
    return res;
  }

  static async logout(req: NextRequest) {
    // Note: We'd extract userId if we're blacklisting
    const res = ApiResponse.success(null, "Logged out successfully");
    clearCookies(res);
    return res;
  }
}
