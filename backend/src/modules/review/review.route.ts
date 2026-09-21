import { NextRequest, NextResponse } from "next/server";
import { ReviewController } from "./review.controller";

export async function reviewRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "POST" && pathLen === 0) {
    return await ReviewController.create(req);
  }

  if (method === "GET" && pathLen === 2 && routePath[0] === "product") {
    return await ReviewController.getByProduct(req, routePath[1]);
  }

  return null;
}
