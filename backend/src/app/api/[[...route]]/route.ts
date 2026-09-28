import { NextRequest, NextResponse } from "next/server";
import { centralRouter } from "@/router";
import { applyCors } from "@/core/middlewares/cors";
import { applySecurityHeaders } from "@/core/middlewares/security";
import { applyRequestId } from "@/core/middlewares/requestId";
import { errorHandler } from "@/core/middlewares/errorHandler";
import { connectToDatabase } from "@/core/database/connection";
import { logger } from "@/core/utils/logger";
import { checkGeneralApiRateLimit } from "@/core/middlewares/rateLimiter";

const applyHeaders = (response: NextResponse, req: NextRequest): NextResponse => {
  applyCors(req, response);
  applySecurityHeaders(response);
  applyRequestId(req, response);
  return response;
};

const handleRequest = async (
  req: NextRequest, 
  props: { params: Promise<{ route?: string[] }> }
) => {
  // Handle OPTIONS (Preflight) immediately without waiting for database connection
  if (req.method === "OPTIONS") {
    const res = new NextResponse("", { status: 200 });
    return applyHeaders(res, req);
  }

  try {
    await connectToDatabase();
    
    const resolvedParams = await props.params;
    let routePath = resolvedParams?.route || [];
    
    // API Versioning Support (/api/v1/...)
    if (routePath[0] === "v1") {
      routePath = routePath.slice(1);
    }
    
    // Request Logger
    logger.info(`[${req.method}] ${req.nextUrl.pathname}`);

    // Global Baseline Rate Limiter (Protects ALL endpoints from DDoS / scraping)
    // Exclude GET /products from global rate limit to allow Next.js SSG to build without failing
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    if (req.method !== 'GET' || !routePath.includes('products')) {
      await checkGeneralApiRateLimit(ip);
    }
    
    // Route to Central Router
    let res = await centralRouter(req, routePath);
    
    if (!res) {
      res = NextResponse.json({ error: "Route not found", debug_routePath: routePath, debug_originalRoute: resolvedParams?.route }, { status: 404 });
    }

    return applyHeaders(res, req);
  } catch (error) {
    const errorRes = errorHandler(error);
    return applyHeaders(errorRes, req);
  }
};

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
