import { NextRequest, NextResponse } from "next/server";
import { WishlistController } from "./wishlist.controller";

export async function wishlistRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "GET" && pathLen === 1 && routePath[0] === "me") {
    return await WishlistController.get(req);
  }

  if (method === "POST" && pathLen === 1 && routePath[0] === "toggle") {
    return await WishlistController.toggle(req);
  }

  return null;
}
