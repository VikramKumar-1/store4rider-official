import { NextRequest, NextResponse } from "next/server";
import { CartController } from "./cart.controller";

export async function cartRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /cart:
   *   get:
   *     summary: Get user's cart
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cart details retrieved successfully
   */
  if (pathLen === 0 && method === "GET") {
    return await CartController.get(req);
  }

  /**
   * @swagger
   * /cart/items:
   *   post:
   *     summary: Add item to cart
   *     operationId: addCartItem
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               productId:
   *                 type: string
   *               quantity:
   *                 type: number
   *     responses:
   *       200:
   *         description: Item added to cart
   */
  if (pathLen === 1 && routePath[0] === "items" && method === "POST") {
    return await CartController.addItem(req);
  }

  return null;
}
