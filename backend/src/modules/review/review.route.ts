import { NextRequest, NextResponse } from "next/server";
import { ReviewController } from "./review.controller";

/**
 * @swagger
 * /api/v1/reviews/store:
 *   get:
 *     summary: Get saved Store/Google reviews for homepage
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of latest 10 saved store reviews
 * 
 * /api/v1/reviews/store/sync:
 *   post:
 *     summary: Fetch latest 10 reviews from SerpApi and save to database
 *     tags: [Reviews]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: Optional SerpApi key (falls back to process.env.SERPAPI_KEY)
 *     responses:
 *       200:
 *         description: Reviews fetched and saved successfully
 */
export async function reviewRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "POST" && pathLen === 0) {
    return await ReviewController.create(req);
  }

  if (method === "GET" && pathLen === 2 && routePath[0] === "product") {
    return await ReviewController.getByProduct(req, routePath[1]);
  }

  if (method === "GET" && pathLen === 1 && routePath[0] === "store") {
    return await ReviewController.getStoreReviews(req);
  }

  if (method === "POST" && pathLen === 2 && routePath[0] === "store" && routePath[1] === "sync") {
    return await ReviewController.syncGoogleReviews(req);
  }

  return null;
}
