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
  static async findAll(
    filters: Record<string, unknown>, 
    skip: number, 
    limit: number,
    sort: Record<string, 1 | -1> = { createdAt: -1, _id: -1 }
  ): Promise<IProduct[]> {
    return ProductModel.find(filters)
      .select("-description -configurableVariations -shortDescription -metaDescription -metaKeywords")
      .sort(sort)
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
   * Finds complementary riding gear across different gear categories
   * for the "Complete Your Kit" cross-selling engine.
   */
  static async findComplementaryGear(categoryKeywords: string[], excludeId: string): Promise<IProduct[]> {
    const results: IProduct[] = [];
    const seenIds = new Set<string>([excludeId]);

    for (const keyword of categoryKeywords) {
      const product = await ProductModel.findOne({
        _id: { $nin: Array.from(seenIds) },
        status: { $ne: "archived" },
        $or: [
          { magentoCategories: { $regex: keyword, $options: "i" } },
          { name: { $regex: keyword, $options: "i" } },
          { tags: { $in: [new RegExp(keyword, "i")] } },
        ],
      })
      .select("name slug sku basePrice specialPrice images magentoCategories brand")
      .sort({ salesCount: -1, _id: -1 })
      .lean()
      .exec();

      if (product) {
        seenIds.add(String((product as any)._id));
        results.push(product as unknown as IProduct);
      }
    }

    return results;
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

  static async updateBySku(sku: string, data: Partial<IProduct>, session?: any): Promise<IProduct | null> {
    const query = ProductModel.findOneAndUpdate({ sku }, data, { new: true });
    if (session) query.session(session);
    return query.lean().exec() as unknown as IProduct | null;
  }

  /**
   * Atomically decrements product stock to prevent overselling and concurrency race conditions.
   */
  static async decrementStock(productId: string, variantId: string | undefined, quantity: number, session?: any): Promise<boolean> {
    if (variantId) {
      const result = await ProductModel.updateOne(
        { _id: productId, "variants.id": variantId, "variants.stock": { $gte: quantity } },
        { $inc: { "variants.$.stock": -quantity } }
      ).session(session || null).exec();
      return result.modifiedCount > 0;
    } else {
      const result = await ProductModel.findOne(
        { _id: productId, stockStatus: 1 }
      ).session(session || null).select("_id").lean().exec();
      return !!result;
    }
  }

  static async incrementStock(productId: string, variantId: string | undefined, quantity: number, session?: any): Promise<void> {
    if (variantId) {
      await ProductModel.updateOne(
        { _id: productId, "variants.id": variantId },
        { $inc: { "variants.$.stock": quantity } }
      ).session(session || null).exec();
    }
  }

  static async incrementSalesCount(productId: string, quantity: number, session?: any): Promise<boolean> {
    const result = await ProductModel.updateOne(
      { _id: productId },
      { $inc: { salesCount: quantity } }
    ).session(session || null).exec();
    return result.modifiedCount > 0;
  }

  static async decrementSalesCount(productId: string, quantity: number, session?: any): Promise<boolean> {
    const result = await ProductModel.updateOne(
      { _id: productId },
      { $inc: { salesCount: -quantity } }
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
