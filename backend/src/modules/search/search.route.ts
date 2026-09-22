import { SearchController } from "./search.controller";
import { AppError } from "../../core/errors/AppError";

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search & Discovery API (Meilisearch)
 */

export async function searchRouter(req: Request, routePath: string) {
  const method = req.method;

  /**
   * @swagger
   * /api/v1/search/suggest:
   *   get:
   *     summary: Get search autocomplete suggestions
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         required: true
   *         description: The search query
   *     responses:
   *       200:
   *         description: Suggestions retrieved successfully
   */
  if (method === "GET" && routePath === "suggest") {
    return await SearchController.suggest(req);
  }

  throw new AppError("Route not found in Search module", 404);
}
