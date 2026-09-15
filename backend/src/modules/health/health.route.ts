import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../core/response/ApiResponse";

/**
 * @file health.route.ts
 * @description API endpoint for basic service health checks.
 */
export async function healthRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  if (req.method === "GET") {
    return ApiResponse.success({ status: "OK", timestamp: new Date().toISOString() }, "Service is running");
  }
  return null;
}
