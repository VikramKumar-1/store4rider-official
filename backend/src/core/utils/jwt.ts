import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

const ACCESS_SECRET = ENV.JWT_ACCESS_SECRET;
const REFRESH_SECRET = ENV.JWT_REFRESH_SECRET;

/**
 * Generates an access token and a refresh token for the user.
 * Access token expires in 15 minutes.
 * Refresh token expires in 7 days.
 */
export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

/**
 * Verifies a JWT token.
 * @param token - The token to verify
 * @param isRefresh - Whether to check against the refresh secret
 */
export const verifyToken = (token: string, isRefresh = false) => {
  const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
  return jwt.verify(token, secret) as { userId: string };
};
