import { NextRequest, NextResponse } from "next/server";
/**
 * @file category.route.ts
 * @description Defines API endpoints for Categories and maps them to Controller methods.
 */
import { CategoryController } from "./category.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";

export async function categoryRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /category/tree:
   *   get:
   *     summary: Get full category tree
   *     description: |
   *       ### 🌲 What is the purpose of this API?
   *       This is one of the most critical endpoints for the UI. It returns the entire category structure (e.g., Helmets -> Full Face -> Carbon Fiber) in a nested tree format.
   *       
   *       ### 🚀 Performance & Architecture Details:
   *       - **Redis Caching:** Because categories rarely change but are loaded on *every single page* of the frontend (for the Navigation Menu), this API caches the entire tree in Redis. 
   *       - **Load Time:** By reading from RAM (Redis) instead of querying MongoDB every time, this endpoint responds in under 10 milliseconds, making the website feel lightning fast!
   *     tags: [Categories]
   *     responses:
   *       200:
   *         description: Hierarchical list of categories
   */
  if (method === "GET" && pathLen === 1 && routePath[0] === "tree") {
    return await CategoryController.getTree(req);
  }

  /**
   * @swagger
   * /category:
   *   post:
   *     summary: Create a category [Admin Only]
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               parentId:
   *                 type: string
   *                 nullable: true
   *     responses:
   *       201:
   *         description: Category created
   */
  if (method === "POST" && pathLen === 0) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, async () => "admin");
    return await CategoryController.create(req);
  }

  return null;
}
