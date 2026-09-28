import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-request-id, idempotency-key, Idempotency-Key, Accept, Cache-Control, X-Requested-With, Pragma",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "86400",
};

function resolveOrigin(origin: string): string {
  if (!isProd && origin) return origin;
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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Docs Protection Logic (from proxy.ts)
  if (pathname.startsWith("/docs") || pathname.startsWith("/api/docs")) {
    if (pathname !== "/docs/login") {
      const authCookie = req.cookies.get("docs_auth_session");
      if (!authCookie || authCookie.value !== "authenticated") {
        const loginUrl = new URL("/docs/login", req.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 2. CORS Logic
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const origin = req.headers.get("origin") || "";
  const allowedOrigin = resolveOrigin(origin);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        ...CORS_HEADERS,
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/docs/:path*"],
};
