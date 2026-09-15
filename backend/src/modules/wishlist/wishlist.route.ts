import { NextRequest, NextResponse } from "next/server";
import { WishlistController } from "./wishlist.controller";

export async function wishlistRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /wishlist/me:
   *   get:
   *     summary: Get my wishlist
   *     description: |
   *       ### 🛒 What is this API?
   *       This endpoint retrieves all the products that you have saved to your personal Wishlist.
   *       
   *       ### ⚙️ How it works?
   *       1. It checks your **Authorization Token** to verify your identity.
   *       2. It fetches your Wishlist document from **MongoDB**.
   *       3. It automatically populates the product details (name, image, price) so the frontend can display them directly.
   *       
   *       ### 🧪 How to test?
   *       1. Make sure you are logged in (Use `/auth/login` and copy the Token).
   *       2. Click on the **Security** button above and paste the Token.
   *       3. Click **"Send API Request"** on the right side!
   *     tags: [Wishlist]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of wishlist items
   */
  if (method === "GET" && pathLen === 1 && routePath[0] === "me") {
    return await WishlistController.get(req);
  }

  /**
   * @swagger
   * /wishlist/toggle:
   *   post:
   *     summary: Toggle product in wishlist
   *     tags: [Wishlist]
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
   *     responses:
   *       200:
   *         description: Wishlist updated
   */
  if (method === "POST" && pathLen === 1 && routePath[0] === "toggle") {
    return await WishlistController.toggle(req);
  }

  return null;
}
