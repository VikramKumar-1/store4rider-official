import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-request-id, idempotency-key, Idempotency-Key, Accept, Cache-Control, X-Requested-With, Pragma",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

/**
 * Resolves the allowed origin for the CORS response.
 * - Development: Echo back ANY origin (like wildcard, but credentials-compatible)
 * - Production: Strict allowlist check
 */
function resolveOrigin(origin: string): string {
  // Development — allow everything, echo the incoming origin
  if (!isProd && origin) {
    return origin;
  }

  // Production — strict allowlist
  const envOrigins = [
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : []),
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : []),
  ]
    .map((u) => u.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const allowedSet = new Set([
    "https://store4riders.com",
    "https://www.store4riders.com",
    ...envOrigins,
  ]);

  const isAllowed =
    allowedSet.has(origin) ||
    origin === "https://store4riders.com" ||
    origin.endsWith(".store4riders.com") ||
    origin.endsWith(".vercel.app");

  if (origin && isAllowed) return origin;
  return envOrigins[0] || "https://www.store4riders.com";
}

/**
 * Next.js Edge Middleware — CORS Handler
 *
 * Runs BEFORE route handlers at the framework level.
 * Guarantees CORS headers on ALL API responses, even if the route handler
 * throws an unhandled error (DB crash, module import failure, etc.).
 */
export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin") || "";
  const allowedOrigin = resolveOrigin(origin);

  // OPTIONS preflight — respond immediately, skip route handler entirely
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        ...CORS_HEADERS,
      },
    });
  }

  // All other methods — attach CORS headers and continue to route handler
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
