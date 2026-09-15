import { NextRequest, NextResponse } from "next/server";
import { ReviewController } from "./review.controller";

export async function reviewRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /review:
   *   post:
   *     summary: Create a product review
   *     tags: [Reviews]
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
   *               rating:
   *                 type: number
   *               comment:
   *                 type: string
   *     responses:
   *       201:
   *         description: Review created
   */
  if (method === "POST" && pathLen === 0) {
    return await ReviewController.create(req);
  }

  /**
   * @swagger
   * /review/product/{productId}:
   *   get:
   *     summary: Get reviews for a product
   *     tags: [Reviews]
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of reviews
   */
  if (method === "GET" && pathLen === 2 && routePath[0] === "product") {
    return await ReviewController.getByProduct(req, routePath[1]);
  }

  return null;
}
