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
