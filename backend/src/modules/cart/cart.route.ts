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
   *     description: |
   *       ### 🛒 What is the purpose of this API?
   *       This API syncs the user's shopping cart with the database, allowing them to keep items in their cart across multiple devices (Mobile App & Website).
   *       
   *       ### 🛍️ Real-World Business Cases:
   *       - **Cross-Device Sync:** If a user adds a helmet to their cart on their iPhone, they will see the same helmet when they log in on their Laptop.
   *       - **Stock Validation:** When adding an item, the backend checks if the `productId` actually exists and is currently in stock. It prevents adding out-of-stock items.
   *       - **Data Integrity:** The API only stores the `productId` and `quantity`. It never trusts the frontend for the `price`, preventing tampering.
   *     tags: [Cart]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - productId
   *               - quantity
   *             properties:
   *               productId:
   *                 type: string
   *                 pattern: "^[0-9a-fA-F]{24}$"
   *                 description: "Valid 24-character MongoDB ObjectId for the product. Required."
   *               quantity:
   *                 type: number
   *                 minimum: 1
   *                 maximum: 10
   *                 description: "Number of items to add. Must be between 1 and 10."
   *     responses:
   *       200:
   *         description: Item added to cart
   */
  if (pathLen === 1 && routePath[0] === "items" && method === "POST") {
    return await CartController.addItem(req);
  }

  return null;
}
