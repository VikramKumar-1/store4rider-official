import { BlogRepository } from "./blog.repository";
import { IBlogPost, IBlogCategory, IBlogPostQuery } from "@store4riders/shared-types";
import { NotFoundError, ConflictError, ValidationError } from "../../core/errors/AppError";
import { slugify } from "@store4riders/shared-utils";
import { FilterQuery } from "mongoose";

function extractWordStats(htmlOrText: string): { wordCount: number; readingTimeMinutes: number } {
  if (!htmlOrText) return { wordCount: 0, readingTimeMinutes: 1 };
  // Strip HTML tags to get pure text content
  const cleanText = htmlOrText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTimeMinutes };
}

export class BlogService {
  // ===================== POSTS =====================

  static async getPosts(query: IBlogPostQuery = {}) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 10;
    const filter: FilterQuery<IBlogPost> = {};

    // Status filter
    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }

    // Category filter
    if (query.categorySlug) {
      filter.categorySlug = query.categorySlug.toLowerCase();
    } else if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    // Tag filter
    if (query.tag) {
      filter.tags = query.tag;
    }

    // Search query
    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), "i");
      filter.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
      ];
    }

    const { items, totalCount } = await BlogRepository.findPosts(
      filter,
      page,
      limit,
      query.sortBy || "publishedAt",
      query.sortOrder || "desc"
    );

    return {
      items,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }

  static async getPostBySlug(slug: string, incrementView: boolean = true): Promise<IBlogPost> {
    if (!slug) throw new ValidationError("Blog slug is required");

    const post = await BlogRepository.findPostBySlug(slug);
    if (!post) {
      throw new NotFoundError("Blog post not found");
    }

    if (incrementView && post._id) {
      await BlogRepository.incrementViews(post._id.toString());
    }

    return post;
  }

  static async getPostById(id: string): Promise<IBlogPost> {
    if (!id) throw new ValidationError("Blog post ID is required");

    const post = await BlogRepository.findPostById(id);
    if (!post) {
      throw new NotFoundError("Blog post not found");
    }
    return post;
  }

  static async getRelatedPosts(slug: string, limit: number = 4): Promise<IBlogPost[]> {
    const post = await BlogRepository.findPostBySlug(slug);
    if (!post) {
      return [];
    }

    return await BlogRepository.findRelatedPosts(
      post.slug,
      post.categorySlug,
      post.tags,
      limit
    );
  }

  static async createPost(data: Partial<IBlogPost>): Promise<IBlogPost> {
    if (!data.title) throw new ValidationError("Post title is required");
    if (!data.content) throw new ValidationError("Post content is required");

    const slug = data.slug ? slugify(data.slug) : slugify(data.title);
    const existing = await BlogRepository.findPostBySlug(slug);
    if (existing) {
      throw new ConflictError(`Blog post with slug "${slug}" already exists`);
    }

    const { wordCount, readingTimeMinutes } = extractWordStats(data.content);

    // If categoryId is provided, fill categoryName & categorySlug
    let categoryName = data.categoryName || "";
    let categorySlug = data.categorySlug || "";
    if (data.categoryId) {
      const category = await BlogRepository.findCategoryById(data.categoryId);
      if (category) {
        categoryName = category.name;
        categorySlug = category.slug;
      }
    }

    const postData: Partial<IBlogPost> = {
      ...data,
      slug,
      categoryName,
      categorySlug,
      wordCount,
      readingTimeMinutes,
      status: data.status || "published",
      publishedAt: data.status === "published" ? data.publishedAt || new Date() : undefined,
    };

    const created = await BlogRepository.createPost(postData);

    // Update category article count
    if (categorySlug) {
      const count = await BlogRepository.countPostsByCategory(categorySlug);
      await BlogRepository.updateCategoryArticleCount(categorySlug, count);
    }

    return created;
  }

  static async updatePost(id: string, data: Partial<IBlogPost>): Promise<IBlogPost> {
    if (!id) throw new ValidationError("Post ID is required");

    const existing = await BlogRepository.findPostById(id);
    if (!existing) {
      throw new NotFoundError("Blog post not found");
    }

    let slug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      slug = slugify(data.slug);
      const conflict = await BlogRepository.findPostBySlug(slug);
      if (conflict && conflict._id?.toString() !== id) {
        throw new ConflictError(`Blog post with slug "${slug}" already exists`);
      }
    }

    let { wordCount, readingTimeMinutes } = {
      wordCount: existing.wordCount || 0,
      readingTimeMinutes: existing.readingTimeMinutes || 1,
    };

    if (data.content && data.content !== existing.content) {
      const stats = extractWordStats(data.content);
      wordCount = stats.wordCount;
      readingTimeMinutes = stats.readingTimeMinutes;
    }

    let categoryName = data.categoryName !== undefined ? data.categoryName : existing.categoryName;
    let categorySlug = data.categorySlug !== undefined ? data.categorySlug : existing.categorySlug;

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await BlogRepository.findCategoryById(data.categoryId);
      if (category) {
        categoryName = category.name;
        categorySlug = category.slug;
      }
    }

    // Published date management
    let publishedAt = data.publishedAt !== undefined ? data.publishedAt : existing.publishedAt;
    if (data.status === "published" && !existing.publishedAt && !publishedAt) {
      publishedAt = new Date();
    }

    const updatePayload: Partial<IBlogPost> = {
      ...data,
      slug,
      categoryName,
      categorySlug,
      wordCount,
      readingTimeMinutes,
      publishedAt,
    };

    const updated = await BlogRepository.updatePost(id, updatePayload);
    if (!updated) {
      throw new NotFoundError("Failed to update blog post");
    }

    // Recalculate category counts if category changed
    if (categorySlug && categorySlug !== existing.categorySlug) {
      const newCount = await BlogRepository.countPostsByCategory(categorySlug);
      await BlogRepository.updateCategoryArticleCount(categorySlug, newCount);
      if (existing.categorySlug) {
        const oldCount = await BlogRepository.countPostsByCategory(existing.categorySlug);
        await BlogRepository.updateCategoryArticleCount(existing.categorySlug, oldCount);
      }
    }

    return updated;
  }

  static async deletePost(id: string): Promise<IBlogPost> {
    if (!id) throw new ValidationError("Post ID is required");

    const deleted = await BlogRepository.deletePost(id);
    if (!deleted) {
      throw new NotFoundError("Blog post not found");
    }

    if (deleted.categorySlug) {
      const count = await BlogRepository.countPostsByCategory(deleted.categorySlug);
      await BlogRepository.updateCategoryArticleCount(deleted.categorySlug, count);
    }

    return deleted;
  }

  // ===================== CATEGORIES =====================

  static async getAllCategories(includeInactive: boolean = false): Promise<IBlogCategory[]> {
    return await BlogRepository.findAllCategories(includeInactive);
  }

  static async getCategoryById(id: string): Promise<IBlogCategory> {
    if (!id) throw new ValidationError("Category ID is required");
    const category = await BlogRepository.findCategoryById(id);
    if (!category) {
      throw new NotFoundError("Blog category not found");
    }
    return category;
  }

  static async getCategoryBySlug(slug: string): Promise<IBlogCategory> {
    if (!slug) throw new ValidationError("Category slug is required");
    const category = await BlogRepository.findCategoryBySlug(slug);
    if (!category) {
      throw new NotFoundError("Blog category not found");
    }
    return category;
  }

  static async createCategory(data: Partial<IBlogCategory>): Promise<IBlogCategory> {
    if (!data.name) throw new ValidationError("Category name is required");

    const slug = data.slug ? slugify(data.slug) : slugify(data.name);
    const existing = await BlogRepository.findCategoryBySlug(slug);
    if (existing) {
      throw new ConflictError(`Blog category with slug "${slug}" already exists`);
    }

    return await BlogRepository.createCategory({
      ...data,
      slug,
      articleCount: 0,
    });
  }

  static async updateCategory(id: string, data: Partial<IBlogCategory>): Promise<IBlogCategory> {
    if (!id) throw new ValidationError("Category ID is required");

    const existing = await BlogRepository.findCategoryById(id);
    if (!existing) {
      throw new NotFoundError("Blog category not found");
    }

    let slug = existing.slug;
    if (data.slug && data.slug !== existing.slug) {
      slug = slugify(data.slug);
      const conflict = await BlogRepository.findCategoryBySlug(slug);
      if (conflict && conflict._id?.toString() !== id) {
        throw new ConflictError(`Blog category with slug "${slug}" already exists`);
      }
    }

    const updated = await BlogRepository.updateCategory(id, { ...data, slug });
    if (!updated) {
      throw new NotFoundError("Failed to update blog category");
    }
    return updated;
  }

  static async deleteCategory(id: string): Promise<IBlogCategory> {
    if (!id) throw new ValidationError("Category ID is required");
    const deleted = await BlogRepository.deleteCategory(id);
    if (!deleted) {
      throw new NotFoundError("Blog category not found");
    }
    return deleted;
  }

  // ===================== SEED / MIGRATION =====================

  static async seedFromGuides(categories: any[], posts: any[]): Promise<{ categoriesSeeded: number; postsSeeded: number }> {
    let categoriesSeeded = 0;
    let postsSeeded = 0;

    for (const cat of categories) {
      const slug = cat.slug || slugify(cat.name);
      const exists = await BlogRepository.findCategoryBySlug(slug);
      if (!exists) {
        await BlogRepository.createCategory({
          name: cat.name,
          slug,
          description: cat.description || "",
          articleCount: cat.articleCount || 0,
          isActive: true,
        });
        categoriesSeeded++;
      }
    }

    for (const p of posts) {
      const slug = p.slug || slugify(p.title);
      const exists = await BlogRepository.findPostBySlug(slug);
      if (!exists) {
        const stats = extractWordStats(p.content || "");
        await BlogRepository.createPost({
          title: p.title,
          slug,
          content: p.content,
          excerpt: p.description || "",
          featuredImage: p.featuredImage || "",
          categorySlug: p.categorySlug,
          categoryName: p.categoryName,
          tags: p.tags || [],
          author: p.author || { name: "Store4Riders Team" },
          status: "published",
          publishedAt: p.publishedDate ? new Date(p.publishedDate) : new Date(),
          wordCount: p.wordCount || stats.wordCount,
          readingTimeMinutes: p.readingTimeMinutes || stats.readingTimeMinutes,
          views: 0,
        });
        postsSeeded++;
      }
    }

    return { categoriesSeeded, postsSeeded };
  }
}
