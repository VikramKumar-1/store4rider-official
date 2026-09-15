import { NextRequest, NextResponse } from "next/server";
/**
 * @file product.route.ts
 * @description Defines API endpoints for Products and maps them to Controller methods.
 */
import { ProductController } from "./product.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkAdmin } from "../../core/middlewares/admin";

export async function productRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Get all products
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter by category slug
   *       - in: query
   *         name: sort
   *         schema:
   *           type: string
   *         description: Sort field (e.g. price,-createdAt)
   *     responses:
   *       200:
   *         description: A list of products
   */
  if (method === "GET" && pathLen === 0) {
    return await ProductController.list(req);
  }
  
  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Create a new product [Admin Only]
   *     tags: [Products]
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
   *               price:
   *                 type: number
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Product created successfully
   */
  if (method === "POST" && pathLen === 0) {
    const userId = extractUserFromAuth(req);
    // Mock role fetch for now
    await checkAdmin(userId, async () => "admin"); 
    return await ProductController.create(req);
  }

  /**
   * @swagger
   * /products/by-skus:
   *   get:
   *     summary: Get products by SKU list
   *     tags: [Products]
   *     parameters:
   *       - in: query
   *         name: skus
   *         required: true
   *         schema:
   *           type: string
   *         description: Comma-separated SKU list
   *     responses:
   *       200:
   *         description: List of matching products
   */
  if (method === 'GET' && pathLen === 1 && routePath[0] === 'by-skus') {
    return await ProductController.getBySkus(req);
  }

  if (pathLen === 1) {
    const param = routePath[0];
    
    /**
     * @swagger
     * /products/{slug}:
     *   get:
     *     summary: Get product by slug
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: slug
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Product details
     */
    if (method === "GET") {
      return await ProductController.getBySlug(req, param);
    }
    
    /**
     * @swagger
     * /products/{id}:
     *   put:
     *     summary: Update product [Admin Only]
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Product updated
     */
    if (method === "PUT") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, async () => "admin");
      return await ProductController.update(req, param);
    }
    
    /**
     * @swagger
     * /products/{id}:
     *   delete:
     *     summary: Delete product [Admin Only]
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Product deleted
     */
    if (method === "DELETE") {
      const userId = extractUserFromAuth(req);
      await checkAdmin(userId, async () => "admin");
      return await ProductController.delete(req, param);
    }
  }

  return null; // Route not matched
}
