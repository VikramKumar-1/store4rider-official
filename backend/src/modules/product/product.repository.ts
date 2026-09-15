/**
 * @fileoverview Product Repository — Database Access Layer
 *
 * Handles all direct MongoDB/Mongoose operations for the Product entity.
 * This is the ONLY layer that should contain database-specific queries.
 * Services call this layer — controllers NEVER call this directly.
 *
 * @module modules/product
 * @layer Repository (Data Access)
 */

/**
 * @class ProductRepository
 * @description Direct database access layer for Products.
 * Keeps Mongoose specifics completely hidden from the Service layer.
 */
import { ProductModel } from "./product.model";
import { IProduct } from "@store4riders/shared-types";

export class ProductRepository {
  /**
   * Retrieves a paginated list of products.
   * Uses a projection to exclude heavy fields (description, configurableVariations)
   * that are not needed for product listing cards.
   * @param filters - Query filters (categoryId, etc)
   * @param skip - Number of documents to skip
   * @param limit - Maximum number of documents to return
   * @returns Array of plain product objects (without heavy fields)
   */
  static async findAll(filters: Record<string, unknown>, skip: number, limit: number): Promise<IProduct[]> {
    return ProductModel.find(filters)
      .select("-description -configurableVariations -shortDescription -metaDescription -metaKeywords")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as unknown as IProduct[];
  }

  /**
   * Counts total products for given filters.
   */
  static async count(filters: Record<string, unknown>): Promise<number> {
    return ProductModel.countDocuments(filters).exec();
  }

  /**
   * Finds a product by its unique slug.
   */
  static async findBySlug(slug: string): Promise<IProduct | null> {
    return ProductModel.findOne({ slug }).lean().exec() as unknown as IProduct | null;
  }

  /**
   * Finds a product by its ID.
   */
  static async findById(id: string): Promise<IProduct | null> {
    return ProductModel.findById(id).lean().exec() as unknown as IProduct | null;
  }

  static async findBySkus(skus: string[]): Promise<IProduct[]> {
    if (!skus || skus.length === 0) return [];
    return ProductModel.find({ sku: { $in: skus } }).lean().exec() as unknown as IProduct[];
  }

  /**
   * Creates a new product.
   */
  static async create(data: Partial<IProduct>): Promise<IProduct> {
    const product = new ProductModel(data);
    return (await product.save()).toObject() as IProduct;
  }

  /**
   * Updates an existing product.
   */
  static async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return ProductModel.findByIdAndUpdate(id, data, { new: true }).lean().exec() as unknown as IProduct | null;
  }

  /**
   * Atomically decrements product stock to prevent overselling and concurrency race conditions.
   */
  static async decrementStock(productId: string, quantity: number, session?: any): Promise<boolean> {
    const result = await ProductModel.updateOne(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    ).session(session || null).exec();
    return result.modifiedCount > 0;
  }

  /**
   * Deletes a product.
   */
  static async delete(id: string): Promise<void> {
    await ProductModel.findByIdAndDelete(id).exec();
  }
}
