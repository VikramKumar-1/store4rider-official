import { NextRequest } from "next/server";
import { verifyToken } from "../utils/jwt";
import { UnauthorizedError } from "../errors/AppError";

/**
 * Authentication middleware.
 * Extracts JWT from HttpOnly cookie, verifies it, and returns the userId.
 * Throws UnauthorizedError if invalid or missing.
 */
export const extractUserFromAuth = (req: NextRequest): string => {
  // First, check the Authorization header (used by Mobile Apps & Swagger UI)
  const authHeader = req.headers.get("authorization");
  let token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  // Fallback to HttpOnly Cookie (used by Web Frontend)
  if (!token) {
    token = req.cookies.get("accessToken")?.value || null;
  }

  if (!token) {
    throw new UnauthorizedError("No access token provided");
  }

  try {
    const decoded = verifyToken(token);
    return decoded.userId;
  } catch (error) {
    throw new UnauthorizedError("Invalid or expired access token");
  }
};
