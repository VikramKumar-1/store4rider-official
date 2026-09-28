import { NextRequest, NextResponse } from "next/server";
import { CartController } from "./cart.controller";

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get current authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *   delete:
 *     summary: Clear authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 * 
 * /api/v1/cart/items:
 *   post:
 *     summary: Add an item to user's cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *               quantity: { type: number }
 *     responses:
 *       200:
 *         description: Item added successfully
 *   put:
 *     summary: Update an item's quantity in cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *               quantity: { type: number }
 *     responses:
 *       200:
 *         description: Item updated successfully
 *   delete:
 *     summary: Remove an item from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *               itemId: { type: string }
 *     responses:
 *       200:
 *         description: Item removed successfully
 * 
 * /api/v1/cart/sync:
 *   post:
 *     summary: Synchronize local guest cart items into authenticated user's cloud cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Cart synchronized successfully
 */
export async function cartRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (pathLen === 0 && method === "GET") {
    return await CartController.get(req);
  }

  if (pathLen === 0 && method === "DELETE") {
    return await CartController.clearCart(req);
  }

  if (pathLen === 1 && routePath[0] === "items" && method === "POST") {
    return await CartController.addItem(req);
  }

  if (pathLen === 1 && routePath[0] === "items" && method === "PUT") {
    return await CartController.updateQuantity(req);
  }

  if (pathLen === 1 && routePath[0] === "items" && method === "DELETE") {
    return await CartController.removeItem(req);
  }

  if (pathLen === 1 && routePath[0] === "sync" && method === "POST") {
    return await CartController.syncCart(req);
  }

  return null;
}
