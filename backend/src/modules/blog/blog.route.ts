import { NextRequest, NextResponse } from "next/server";
import { BlogController } from "./blog.controller";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { checkPermission } from "../../core/middlewares/permission";
import { PermissionAction } from "../../core/config/permissions";
import { UserService } from "../user/user.service";

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Blog posts and category management
 */

export async function blogRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  // ========================================================
  // PUBLIC ROUTES
  // ========================================================

  // GET /api/v1/blog/posts -> public list
  if (method === "GET" && pathLen === 1 && routePath[0] === "posts") {
    return await BlogController.getPublicPosts(req);
  }

  // GET /api/v1/blog/posts/:slug/related -> related posts
  if (method === "GET" && pathLen === 3 && routePath[0] === "posts" && routePath[2] === "related") {
    return await BlogController.getRelatedPosts(req, routePath[1]);
  }

  // GET /api/v1/blog/posts/:slug -> single post
  if (method === "GET" && pathLen === 2 && routePath[0] === "posts") {
    return await BlogController.getPostBySlug(req, routePath[1]);
  }

  // GET /api/v1/blog/categories -> public category list
  if (method === "GET" && pathLen === 1 && routePath[0] === "categories") {
    return await BlogController.getPublicCategories(req);
  }

  // ========================================================
  // ADMIN ROUTES (Protected by PermissionAction.MANAGE_BLOGS)
  // ========================================================
  if (pathLen >= 1 && routePath[0] === "admin") {
    const userId = extractUserFromAuth(req);
    await checkPermission(userId, PermissionAction.MANAGE_BLOGS, UserService.getRole);

    // POST /api/v1/blog/admin/seed
    if (method === "POST" && pathLen === 2 && routePath[1] === "seed") {
      return await BlogController.seedInitial(req);
    }

    // GET /api/v1/blog/admin/posts
    if (method === "GET" && pathLen === 2 && routePath[1] === "posts") {
      return await BlogController.adminGetPosts(req);
    }

    // POST /api/v1/blog/admin/posts
    if (method === "POST" && pathLen === 2 && routePath[1] === "posts") {
      return await BlogController.createPost(req);
    }

    // GET /api/v1/blog/admin/posts/:id
    if (method === "GET" && pathLen === 3 && routePath[1] === "posts") {
      return await BlogController.adminGetPostById(req, routePath[2]);
    }

    // PUT /api/v1/blog/admin/posts/:id
    if (method === "PUT" && pathLen === 3 && routePath[1] === "posts") {
      return await BlogController.updatePost(req, routePath[2]);
    }

    // DELETE /api/v1/blog/admin/posts/:id
    if (method === "DELETE" && pathLen === 3 && routePath[1] === "posts") {
      return await BlogController.deletePost(req, routePath[2]);
    }

    // GET /api/v1/blog/admin/categories
    if (method === "GET" && pathLen === 2 && routePath[1] === "categories") {
      return await BlogController.adminGetCategories(req);
    }

    // POST /api/v1/blog/admin/categories
    if (method === "POST" && pathLen === 2 && routePath[1] === "categories") {
      return await BlogController.createCategory(req);
    }

    // PUT /api/v1/blog/admin/categories/:id
    if (method === "PUT" && pathLen === 3 && routePath[1] === "categories") {
      return await BlogController.updateCategory(req, routePath[2]);
    }

    // DELETE /api/v1/blog/admin/categories/:id
    if (method === "DELETE" && pathLen === 3 && routePath[1] === "categories") {
      return await BlogController.deleteCategory(req, routePath[2]);
    }
  }

  return null;
}
