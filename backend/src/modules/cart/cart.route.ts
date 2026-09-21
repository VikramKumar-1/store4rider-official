import { NextRequest, NextResponse } from "next/server";
import { CartController } from "./cart.controller";

export async function cartRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (pathLen === 0 && method === "GET") {
    return await CartController.get(req);
  }

  if (pathLen === 1 && routePath[0] === "items" && method === "POST") {
    return await CartController.addItem(req);
  }

  return null;
}
