import { NextRequest, NextResponse } from "next/server";

/**
 * Helper to normalize origin URLs (strips trailing slashes and trims whitespace)
 */
const normalizeOrigin = (url: string): string => url.trim().replace(/\/+$/, "");

/**
 * Enterprise Dynamic CORS Middleware
 * Supports:
 * - Production: store4riders.com & any subdomain (*.store4riders.com)
 * - Environment: FRONTEND_URL & ALLOWED_ORIGINS (supports comma-separated origins for VPS / Hostinger / AWS)
 * - Local Development: localhost & 127.0.0.1 on any port
 * - Testing: *.vercel.app preview branches
 */
export const applyCors = (req: NextRequest, res: NextResponse): NextResponse => {
  const rawOrigin = req.headers.get("origin") || "";
  const origin = normalizeOrigin(rawOrigin);

  // 1. Parse origins dynamically from environment variables
  const envOrigins = [
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  ].map(normalizeOrigin).filter(Boolean);

  // 2. Official production domain fallbacks
  const productionDomains = [
    "https://store4riders.com",
    "https://www.store4riders.com",
  ];

  const allowedSet = new Set([...productionDomains, ...envOrigins]);

  // 3. Dynamic evaluation:
  const isLocalDev = 
    origin.startsWith("http://localhost:") || 
    origin.startsWith("http://127.0.0.1:") || 
    origin === "http://localhost" || 
    origin === "http://127.0.0.1";

  const isStore4RidersDomain = 
    origin === "https://store4riders.com" || 
    origin.endsWith(".store4riders.com");

  const isVercelPreview = origin.endsWith(".vercel.app");

  const isAllowed = 
    !origin || 
    allowedSet.has(origin) || 
    isStore4RidersDomain || 
    isLocalDev || 
    isVercelPreview;

  // Echo matching origin so credentialed requests (cookies/auth) succeed
  if (origin && isAllowed) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else if (envOrigins.length > 0) {
    res.headers.set("Access-Control-Allow-Origin", envOrigins[0]);
  } else {
    res.headers.set("Access-Control-Allow-Origin", "https://www.store4riders.com");
  }

  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-request-id, idempotency-key, Idempotency-Key, Accept, Cache-Control, X-Requested-With, Pragma");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours
  return res;
};
