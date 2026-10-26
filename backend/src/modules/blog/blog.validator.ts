import { NextRequest } from "next/server";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  createBlogCategorySchema,
  updateBlogCategorySchema,
  blogQuerySchema,
} from "@store4riders/shared-validation";

export class BlogValidator {
  static async validateCreatePost(req: NextRequest) {
    const body = await req.json();
    return createBlogPostSchema.parse(body);
  }

  static async validateUpdatePost(req: NextRequest) {
    const body = await req.json();
    return updateBlogPostSchema.parse(body);
  }

  static async validateCreateCategory(req: NextRequest) {
    const body = await req.json();
    return createBlogCategorySchema.parse(body);
  }

  static async validateUpdateCategory(req: NextRequest) {
    const body = await req.json();
    return updateBlogCategorySchema.parse(body);
  }

  static validateQuery(req: NextRequest) {
    const url = new URL(req.url);
    const queryParams: Record<string, any> = {};

    const page = url.searchParams.get("page");
    if (page) queryParams.page = page;

    const limit = url.searchParams.get("limit");
    if (limit) queryParams.limit = limit;

    const status = url.searchParams.get("status");
    if (status) queryParams.status = status;

    const categoryId = url.searchParams.get("categoryId");
    if (categoryId) queryParams.categoryId = categoryId;

    const categorySlug = url.searchParams.get("categorySlug");
    if (categorySlug) queryParams.categorySlug = categorySlug;

    const search = url.searchParams.get("search");
    if (search) queryParams.search = search;

    const tag = url.searchParams.get("tag");
    if (tag) queryParams.tag = tag;

    const sortBy = url.searchParams.get("sortBy");
    if (sortBy) queryParams.sortBy = sortBy;

    const sortOrder = url.searchParams.get("sortOrder");
    if (sortOrder) queryParams.sortOrder = sortOrder;

    return blogQuerySchema.parse(queryParams);
  }
}
