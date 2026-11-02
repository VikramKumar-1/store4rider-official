import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const secretPath = process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH || "rider-staff-gate";

  // Check environment: local development & Vercel previews allow testing without domain restrictions
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.includes(".local");
  const isVercelPreview = host.endsWith(".vercel.app");

  // 1. If accessing via the dedicated admin domain (e.g. admin.store4riders.com)
  if (host.startsWith("admin.")) {
    // If navigating to root on the admin subdomain, rewrite to /admin
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/admin", request.url));
    }
    // Convenience: direct /secret-slug rewrites to /admin/secret-slug
    if (pathname === `/${secretPath}`) {
      return NextResponse.rewrite(new URL(`/admin/${secretPath}`, request.url));
    }
    return NextResponse.next();
  }

  // 2. If accessing via the public storefront on IP 1 (store4riders.com / www)
  // Block any public attempt to access /admin or any admin subpath
  if (!isLocalhost && !isVercelPreview) {
    if (pathname.startsWith("/admin")) {
      return new NextResponse("Not Found", { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to application routes, excluding static assets, images, icons, and api
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|api/).*)",
  ],
};
