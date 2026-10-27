import { NextRequest } from "next/server";
import { BlogService } from "./blog.service";
import { BlogValidator } from "./blog.validator";
import { SettingService } from "../settings/setting.service";
import { ApiResponse } from "../../core/response/ApiResponse";

export class BlogController {
  // ===================== PUBLIC =====================

  static async getPublicPosts(req: NextRequest) {
    const query = BlogValidator.validateQuery(req);
    // Public endpoint only returns published posts
    const result = await BlogService.getPosts({ ...query, status: "published" });
    return ApiResponse.paginated(result.items, result.totalCount, result.page, result.limit);
  }

  static async getPostBySlug(req: NextRequest, slug: string) {
    const post = await BlogService.getPostBySlug(slug, true);
    return ApiResponse.success(post, "Blog post fetched successfully");
  }

  static async getRelatedPosts(req: NextRequest, slug: string) {
    const url = new URL(req.url);
    const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 4;
    const posts = await BlogService.getRelatedPosts(slug, limit);
    return ApiResponse.success(posts, "Related posts fetched successfully");
  }

  static async getPublicCategories(req: NextRequest) {
    const categories = await BlogService.getAllCategories(false);
    return ApiResponse.success(categories, "Blog categories fetched successfully");
  }

  static async getCategoryBySlug(req: NextRequest, slug: string) {
    const category = await BlogService.getCategoryBySlug(slug);
    return ApiResponse.success(category, "Blog category fetched successfully");
  }

  static async getPageSeo(req: NextRequest) {
    const seo = await SettingService.getGuidesPageSeo();
    return ApiResponse.success(seo, "Guides page SEO fetched successfully");
  }

  static async updatePageSeo(req: NextRequest) {
    const body = await req.json();
    const updated = await SettingService.updateGuidesPageSeo(body);
    return ApiResponse.success(updated, "Guides page SEO updated successfully");
  }

  // ===================== ADMIN =====================

  static async adminGetPosts(req: NextRequest) {
    const query = BlogValidator.validateQuery(req);
    // Admin query can request all, draft, or published
    const result = await BlogService.getPosts(query);
    return ApiResponse.paginated(result.items, result.totalCount, result.page, result.limit);
  }

  static async adminGetPostById(req: NextRequest, id: string) {
    const post = await BlogService.getPostById(id);
    return ApiResponse.success(post, "Blog post fetched successfully");
  }

  static async createPost(req: NextRequest) {
    const validatedData = await BlogValidator.validateCreatePost(req);
    const post = await BlogService.createPost(validatedData);
    return ApiResponse.success(post, "Blog post created successfully", 201);
  }

  static async updatePost(req: NextRequest, id: string) {
    const validatedData = await BlogValidator.validateUpdatePost(req);
    const post = await BlogService.updatePost(id, validatedData);
    return ApiResponse.success(post, "Blog post updated successfully");
  }

  static async deletePost(req: NextRequest, id: string) {
    const post = await BlogService.deletePost(id);
    return ApiResponse.success(post, "Blog post deleted successfully");
  }

  static async adminGetCategories(req: NextRequest) {
    const categories = await BlogService.getAllCategories(true);
    return ApiResponse.success(categories, "Blog categories fetched successfully");
  }

  static async createCategory(req: NextRequest) {
    const validatedData = await BlogValidator.validateCreateCategory(req);
    const category = await BlogService.createCategory(validatedData);
    return ApiResponse.success(category, "Blog category created successfully", 201);
  }

  static async updateCategory(req: NextRequest, id: string) {
    const validatedData = await BlogValidator.validateUpdateCategory(req);
    const category = await BlogService.updateCategory(id, validatedData);
    return ApiResponse.success(category, "Blog category updated successfully");
  }

  static async deleteCategory(req: NextRequest, id: string) {
    const category = await BlogService.deleteCategory(id);
    return ApiResponse.success(category, "Blog category deleted successfully");
  }

  static async seedInitial(req: NextRequest) {
    const body = await req.json().catch(() => ({}));
    const categories = body.categories || [];
    const posts = body.posts || [];
    const result = await BlogService.seedFromGuides(categories, posts);
    return ApiResponse.success(result, "Blog content seeded successfully");
  }
}
