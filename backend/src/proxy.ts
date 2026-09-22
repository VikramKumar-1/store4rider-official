import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /docs and /api/docs routes
  if (pathname.startsWith("/docs") || pathname.startsWith("/api/docs")) {
    
    // Allow access to the login page itself
    if (pathname === "/docs/login") {
      return NextResponse.next();
    }

    // Check for the secure custom session cookie
    const authCookie = req.cookies.get("docs_auth_session");

    if (authCookie && authCookie.value === "authenticated") {
      // User has logged in via our custom UI
      return NextResponse.next();
    }

    // If no valid cookie is found, redirect to our premium custom login page
    const loginUrl = new URL("/docs/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Matcher for both docs UI and API docs endpoint
  matcher: ["/docs/:path*", "/api/docs/:path*"],
};
