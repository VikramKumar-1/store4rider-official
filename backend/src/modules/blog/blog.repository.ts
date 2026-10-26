import { ClientSession, FilterQuery } from "mongoose";
import { BlogPostModel, BlogCategoryModel } from "./blog.model";
import { IBlogPost, IBlogCategory, IBlogPostQuery } from "@store4riders/shared-types";

export class BlogRepository {
  // ===================== POSTS =====================

  static async findPosts(
    filter: FilterQuery<IBlogPost>,
    page: number = 1,
    limit: number = 10,
    sortBy: string = "publishedAt",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<{ items: IBlogPost[]; totalCount: number }> {
    const skip = (page - 1) * limit;
    const sortField = sortBy === "views" ? "views" : sortBy === "title" ? "title" : sortBy === "createdAt" ? "createdAt" : "publishedAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const [items, totalCount] = await Promise.all([
      BlogPostModel.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as unknown as Promise<IBlogPost[]>,
      BlogPostModel.countDocuments(filter).exec(),
    ]);

    return { items, totalCount };
  }

  static async findPostById(id: string): Promise<IBlogPost | null> {
    return BlogPostModel.findById(id).lean().exec() as unknown as Promise<IBlogPost | null>;
  }

  static async findPostBySlug(slug: string): Promise<IBlogPost | null> {
    return BlogPostModel.findOne({ slug: slug.toLowerCase() }).lean().exec() as unknown as Promise<IBlogPost | null>;
  }

  static async findRelatedPosts(
    currentSlug: string,
    categorySlug?: string,
    tags?: string[],
    limit: number = 4
  ): Promise<IBlogPost[]> {
    const filter: FilterQuery<IBlogPost> = {
      slug: { $ne: currentSlug.toLowerCase() },
      status: "published",
    };

    const orConditions: any[] = [];
    if (categorySlug) {
      orConditions.push({ categorySlug });
    }
    if (tags && tags.length > 0) {
      orConditions.push({ tags: { $in: tags } });
    }

    if (orConditions.length > 0) {
      filter.$or = orConditions;
    }

    return BlogPostModel.find(filter)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as Promise<IBlogPost[]>;
  }

  static async createPost(data: Partial<IBlogPost>, session?: ClientSession): Promise<IBlogPost> {
    const post = new BlogPostModel(data);
    const saved = await post.save({ session });
    return saved.toObject() as IBlogPost;
  }

  static async updatePost(
    id: string,
    data: Partial<IBlogPost>,
    session?: ClientSession
  ): Promise<IBlogPost | null> {
    return BlogPostModel.findByIdAndUpdate(id, data, { new: true, session })
      .lean()
      .exec() as unknown as Promise<IBlogPost | null>;
  }

  static async deletePost(id: string, session?: ClientSession): Promise<IBlogPost | null> {
    return BlogPostModel.findByIdAndDelete(id, { session })
      .lean()
      .exec() as unknown as Promise<IBlogPost | null>;
  }

  static async incrementViews(id: string): Promise<void> {
    await BlogPostModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
  }

  static async countPostsByCategory(categorySlug: string): Promise<number> {
    return BlogPostModel.countDocuments({ categorySlug, status: "published" }).exec();
  }

  // ===================== CATEGORIES =====================

  static async findAllCategories(includeInactive: boolean = false): Promise<IBlogCategory[]> {
    const filter = includeInactive ? {} : { isActive: { $ne: false } };
    return BlogCategoryModel.find(filter)
      .sort({ order: 1, name: 1 })
      .lean()
      .exec() as unknown as Promise<IBlogCategory[]>;
  }

  static async findCategoryById(id: string): Promise<IBlogCategory | null> {
    return BlogCategoryModel.findById(id).lean().exec() as unknown as Promise<IBlogCategory | null>;
  }

  static async findCategoryBySlug(slug: string): Promise<IBlogCategory | null> {
    return BlogCategoryModel.findOne({ slug: slug.toLowerCase() }).lean().exec() as unknown as Promise<IBlogCategory | null>;
  }

  static async createCategory(data: Partial<IBlogCategory>, session?: ClientSession): Promise<IBlogCategory> {
    const category = new BlogCategoryModel(data);
    const saved = await category.save({ session });
    return saved.toObject() as IBlogCategory;
  }

  static async updateCategory(
    id: string,
    data: Partial<IBlogCategory>,
    session?: ClientSession
  ): Promise<IBlogCategory | null> {
    return BlogCategoryModel.findByIdAndUpdate(id, data, { new: true, session })
      .lean()
      .exec() as unknown as Promise<IBlogCategory | null>;
  }

  static async deleteCategory(id: string, session?: ClientSession): Promise<IBlogCategory | null> {
    return BlogCategoryModel.findByIdAndDelete(id, { session })
      .lean()
      .exec() as unknown as Promise<IBlogCategory | null>;
  }

  static async updateCategoryArticleCount(slugOrId: string, count: number): Promise<void> {
    await BlogCategoryModel.updateOne(
      { $or: [{ _id: slugOrId }, { slug: slugOrId }] },
      { articleCount: count }
    ).exec();
  }
}
