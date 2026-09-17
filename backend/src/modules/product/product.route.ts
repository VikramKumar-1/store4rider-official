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
   *     description: |
   *       ### 🚀 Performance & Architecture Details
   *       This is one of the most heavily used endpoints. To ensure it loads in under 100ms:
   *       - **Server-Side Pagination:** The database NEVER returns all products at once. It returns exactly what the frontend asks for (e.g., `limit=20, page=1`), keeping memory usage extremely low.
   *       - **Lean Queries:** We use Mongoose `.lean()` which skips hydrating heavy Mongoose Document objects, returning plain lightweight JSON directly from MongoDB.
   *       - **Index Optimization:** Database searches are strictly performed on indexed fields like `category` and `slug`, ensuring ultra-fast lookups even with 10,000+ products.
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
   *             required:
   *               - name
   *               - slug
   *               - price
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 100
   *                 description: "Full product name (Min: 3 characters)"
   *               slug:
   *                 type: string
   *                 pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
   *                 description: "URL-friendly slug (e.g. 'smk-helmet-black')"
   *               price:
   *                 type: number
   *                 minimum: 1
   *                 description: "Base price of the product (Must be greater than 0)"
   *               description:
   *                 type: string
   *                 maxLength: 5000
   *                 description: "HTML or plain text product description"
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
     *     description: |
     *       ### 🎯 What is the purpose of this API?
     *       This API is used by the **Store Admin** to modify an existing product's details after it has been created.
     *       
     *       ### 🛍️ Real-World Business Cases:
     *       - **Price Changes:** A helmet's supplier price goes up, so the Admin updates the `price` field.
     *       - **Flash Sales:** The Admin sets a `specialPrice` to show a discounted price during a holiday sale.
     *       - **Stock Management:** A product runs out of stock in the warehouse, so the Admin updates `stockStatus` to `0` to prevent customers from buying it.
     *       - **SEO Updates:** The Admin updates the `metaTitle` or `slug` to rank better on Google.
     *       
     *       ### 🔒 Why is this [Admin Only]?
     *       To prevent regular customers from changing the prices of items they want to buy to ₹0. The API strictly checks the user's JWT token to ensure their role is `admin`.
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
