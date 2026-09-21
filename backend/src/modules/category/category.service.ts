import { CategoryRepository } from "./category.repository";
import { ICategory } from "@store4riders/shared-types";
import { getCache, setCache, deleteCache } from "../../core/cache/redis";

const CACHE_KEY = "category_tree";

/**
 * @class CategoryService
 * @description Pure business logic for Category management.
 * Highlights:
 * - Operates completely independent of HTTP context.
 * - Auto-caches the category tree in Redis for 1 hour.
 * - Auto-invalidates the cache whenever a new category is created.
 */
export class CategoryService {
  
  static async getCategoryTree() {
    const cached = await getCache(CACHE_KEY);
    if (cached) return cached;

    const categories = await CategoryRepository.findAll();
    const tree = this.buildTree(categories);
    
    await setCache(CACHE_KEY, tree, 3600); // Cache for 1 hour
    return tree;
  }

  static async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await CategoryRepository.create({ ...data, slug });
    await this.invalidateCache();
    return category;
  }

  static async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory> {
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const category = await CategoryRepository.update(id, data);
    if (!category) throw new Error("Category not found");
    await this.invalidateCache();
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new Error("Category not found");
    await CategoryRepository.delete(id);
    await this.invalidateCache();
  }

  static async invalidateCache() {
    await deleteCache(CACHE_KEY);
  }

  private static buildTree(categories: ICategory[], parentId?: string): any[] {
    return categories
      .filter(c => c.parentId === parentId)
      .map(c => ({
        ...c,
        children: this.buildTree(categories, c._id),
      }));
  }
}
