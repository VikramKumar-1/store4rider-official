import { NextRequest, NextResponse } from "next/server";
/**
 * @file user.route.ts
 * @description Defines API endpoints for Users and maps them to Controller methods.
 */
import { UserController } from "./user.controller";

export async function userRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /user/me:
   *   get:
   *     summary: Get my profile
   *     description: |
   *       ### 👤 What is the purpose of this API?
   *       Returns the logged-in user's complete profile, including their saved shipping addresses.
   *       
   *       ### 🛍️ Real-World Business Cases:
   *       - **Checkout Autocomplete:** When a user goes to the Checkout page, the frontend calls this API to pre-fill their saved addresses, saving them from typing it all over again.
   *       - **Account Dashboard:** Used to display the user's name and details in the "My Account" section.
   *       
   *       ### 🔒 Security Layers:
   *       - **Strict Authorization:** This API does not take an ID in the URL. It strictly extracts the user ID directly from the secure JWT token. This makes it impossible for "User A" to hack the URL and view "User B's" profile.
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *   put:
   *     summary: Update profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated
   */
  if (pathLen === 1 && routePath[0] === "me") {
    if (method === "GET") return await UserController.getProfile(req);
    if (method === "PUT") return await UserController.updateProfile(req);
  }

  /**
   * @swagger
   * /user/me/addresses:
   *   post:
   *     summary: Add a new shipping address
   *     operationId: addUserAddress
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 example: "Home"
   *               addressLine1:
   *                 type: string
   *                 example: "123 Main Street"
   *               city:
   *                 type: string
   *                 example: "Mumbai"
   *               state:
   *                 type: string
   *                 example: "Maharashtra"
   *               country:
   *                 type: string
   *                 example: "India"
   *               pincode:
   *                 type: string
   *                 example: "400001"
   *     responses:
   *       201:
   *         description: Address added
   */
  if (pathLen === 2 && routePath[0] === "me" && routePath[1] === "addresses") {
    if (method === "POST") return await UserController.addAddress(req);
  }

  return null;
}
