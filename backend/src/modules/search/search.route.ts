import { NextRequest } from "next/server";
import { SearchController } from "./search.controller";
import { AppError } from "../../core/errors/AppError";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkPermission } from "../../core/middlewares/permission";
import { PermissionAction } from "../../core/config/permissions";
import { UserService } from "../user/user.service";

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Search & Discovery API (Meilisearch & Search Term Redirects)
 */

export async function searchRouter(req: NextRequest, routePath: string) {
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

  /**
   * @swagger
   * /api/v1/search/trending:
   *   get:
   *     summary: Get popular/trending search keywords and top categories
   *     tags: [Search]
   *     responses:
   *       200:
   *         description: Trending searches fetched successfully
   */
  if (method === "GET" && (routePath === "trending" || routePath === "popular")) {
    return await SearchController.trending(req);
  }

  /**
   * @swagger
   * /api/v1/search/redirect:
   *   get:
   *     summary: Check if a search query has a mapped category/URL redirect
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         required: true
   *         description: The search query to check
   *     responses:
   *       200:
   *         description: Returns whether a redirect is active and target URL
   */
  if (method === "GET" && routePath === "redirect") {
    return await SearchController.checkRedirect(req);
  }

  // -------------------------------------------------------------
  // ADMIN SEARCH REDIRECT ROUTES (Protected by Auth & Permission)
  // -------------------------------------------------------------
  if (routePath === "redirects" || routePath.startsWith("redirects/")) {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_CATEGORIES, UserService.getRole);

    const parts = routePath.split("/");
    const id = parts[1];

    if (method === "GET" && routePath === "redirects") {
      return await SearchController.listRedirects(req);
    }

    if (method === "POST" && routePath === "redirects") {
      return await SearchController.createRedirect(req);
    }

    if (id) {
      if (method === "GET") {
        return await SearchController.getRedirectById(id);
      }
      if (method === "PUT") {
        return await SearchController.updateRedirect(req, id);
      }
      if (method === "DELETE") {
        return await SearchController.deleteRedirect(id);
      }
    }
  }

  throw new AppError("Route not found in Search module", 404);
}
