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
   * Finds a product by its ID, SKU, or slug.
   */
  static async findById(id: string): Promise<IProduct | null> {
    if (!id) return null;
    const mongoose = await import("mongoose");
    if (mongoose.default.Types.ObjectId.isValid(id)) {
      const prod = await ProductModel.findById(id).lean().exec();
      if (prod) return prod as unknown as IProduct;
    }
    return ProductModel.findOne({ $or: [{ sku: id }, { slug: id }] }).lean().exec() as unknown as IProduct | null;
  }

  static async findBySkus(skus: string[], inStockOnly = false): Promise<IProduct[]> {
    if (!skus || skus.length === 0) return [];

    const cleanSkus = Array.from(
      new Set(
        skus
          .map((s) => s?.trim())
          .filter((s): s is string => Boolean(s && s.length > 0))
      )
    );
    if (cleanSkus.length === 0) return [];

    const escapeRegex = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regexList = cleanSkus.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i"));

    const query: Record<string, any> = {
      $or: [
        { sku: { $in: regexList } },
        { "variants.sku": { $in: regexList } },
      ],
    };

    if (inStockOnly) {
      query.$and = [
        {
          $or: [
            { stockStatus: { $ne: 0 } },
            { allowBackorders: true },
            { "variants.stock": { $gt: 0 } },
          ],
        },
      ];
    }

    const rawProducts = (await ProductModel.find(query)
      .select("-description -configurableVariations -shortDescription -metaDescription -metaKeywords")
      .lean()
      .exec()) as unknown as IProduct[];

    // Collect all parent products (visible products with variants)
    const parentVariantSkus = new Set<string>();
    for (const p of rawProducts) {
      const isHidden = p.visibility === "1" || p.visibility === "Not Visible Individually";
      if (!isHidden && Array.isArray(p.variants) && p.variants.length > 0) {
        p.variants.forEach((v) => {
          if (v.sku) {
            parentVariantSkus.add(v.sku.trim().toLowerCase());
          }
        });
      }
    }

    // Deduplicate and suppress standalone child documents IF their parent product is already in rawProducts
    const uniqueMap = new Map<string, IProduct>();
    for (const p of rawProducts) {
      const isHidden = p.visibility === "1" || p.visibility === "Not Visible Individually";
      const skuLower = (p.sku || "").trim().toLowerCase();
      if (isHidden && parentVariantSkus.has(skuLower)) {
        continue;
      }
      const pid = String((p as any)._id || p.sku);
      if (!uniqueMap.has(pid)) {
        uniqueMap.set(pid, p);
      }
    }

    return Array.from(uniqueMap.values());
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
        "images.0": { $exists: true },
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

  static async updateBySku(sku: string, data: any, session?: any): Promise<IProduct | null> {
    const cleanSku = sku.trim();
    if (!cleanSku) return null;

    // 1. Try finding and updating as a parent product
    let query = ProductModel.findOneAndUpdate({ sku: cleanSku }, data, { new: true });
    if (session) query.session(session);
    let product = await query.lean().exec() as unknown as IProduct | null;
    if (product) return product;

    // 2. Try case-insensitive parent match
    const escapedSku = cleanSku.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    query = ProductModel.findOneAndUpdate({ sku: new RegExp(`^${escapedSku}$`, "i") }, data, { new: true });
    if (session) query.session(session);
    product = await query.lean().exec() as unknown as IProduct | null;
    if (product) return product;

    // 3. Try finding by child variant SKU
    const parentQuery = ProductModel.findOne({
      "variants.sku": new RegExp(`^${escapedSku}$`, "i"),
    });
    if (session) parentQuery.session(session);
    const parent = await parentQuery.exec();

    if (parent && parent.variants && Array.isArray(parent.variants)) {
      const variantIdx = parent.variants.findIndex(
        (v: any) => v.sku?.toLowerCase() === cleanSku.toLowerCase()
      );

      if (variantIdx >= 0) {
        const v = parent.variants[variantIdx];
        const newPrice = data.basePrice ?? data.price;
        const newSpecialPrice = data.specialPrice ?? data.special_price;
        const newStock = data.qty ?? data.stock;

        if (newPrice !== undefined && newPrice !== "") {
          v.price = Number(newPrice);
        }
        if (newSpecialPrice !== undefined) {
          v.specialPrice = newSpecialPrice === "" || newSpecialPrice === null ? undefined : Number(newSpecialPrice);
        }
        if (newStock !== undefined && newStock !== "") {
          v.stock = Number(newStock);
        } else if (data.stockStatus !== undefined && Number(data.stockStatus) === 0) {
          v.stock = 0;
        }

        // Recalculate parent's overall stockStatus based on all child variants
        const hasAnyStock = parent.variants.some((item: any) => (item.stock || 0) > 0);
        parent.stockStatus = hasAnyStock ? 1 : 0;

        await parent.save({ session: session || undefined });
        return parent.toObject() as unknown as IProduct;
      }
    }

    return null;
  }

  /**
   * Atomically decrements product stock to prevent overselling and concurrency race conditions.
   */
  static async decrementStock(productId: string, variantId: string | undefined, quantity: number, session?: any): Promise<boolean> {
    if (variantId) {
      const product = await ProductModel.findOne({ _id: productId }).session(session || null).lean().exec() as any;
      if (!product) return false;

      const variant = product.variants?.find((v: any) => v.id === variantId || v.sku === variantId);
      if (!variant) return false;

      if (variant.stock < quantity && !product.allowBackorders) return false;

      const matchKey = variant.sku ? "sku" : "id";
      const matchValue = variant.sku || variant.id;

      const elemMatchFilter: any = { [matchKey]: matchValue };
      if (!product.allowBackorders) {
        elemMatchFilter.stock = { $gte: quantity };
      }

      const result = await ProductModel.updateOne(
        { 
          _id: productId, 
          variants: { $elemMatch: elemMatchFilter } 
        },
        { $inc: { "variants.$.stock": -quantity } }
      ).session(session || null).exec();

      if (result.modifiedCount > 0) {
        if (!product.allowBackorders) {
          const updatedProduct = await ProductModel.findOne({ _id: productId }).session(session || null).select("variants").lean().exec() as any;
          const anyInStock = updatedProduct?.variants?.some((v: any) => (v.stock || 0) > 0);
          if (!anyInStock) {
            await ProductModel.updateOne({ _id: productId }, { $set: { stockStatus: 0 } }).session(session || null).exec();
          }
        }
        return true;
      }
      return false;
    } else {
      const product = await ProductModel.findOne({ _id: productId }).session(session || null).lean().exec() as any;
      if (!product) return false;

      const currentQty = typeof product.qty === "number" ? product.qty : (product.stockStatus !== 0 ? 1 : 0);
      if (!product.allowBackorders && currentQty < quantity) {
        return false;
      }

      const filter: any = { _id: productId };
      if (!product.allowBackorders && typeof product.qty === "number" && product.qty > 0) {
        filter.qty = { $gte: quantity };
      }

      const result = await ProductModel.updateOne(
        filter,
        { $inc: { qty: -quantity } }
      ).session(session || null).exec();

      if (result.modifiedCount > 0) {
        if (!product.allowBackorders) {
          const updated = await ProductModel.findOne({ _id: productId }).session(session || null).select("qty").lean().exec() as any;
          if (updated && typeof updated.qty === "number" && updated.qty <= 0) {
            await ProductModel.updateOne({ _id: productId }, { $set: { stockStatus: 0 } }).session(session || null).exec();
          }
        }
        return true;
      }

      // If product had no qty field initialized but was in stock
      if (product.stockStatus !== 0 || product.allowBackorders) {
        return true;
      }
      return false;
    }
  }

  static async incrementStock(productId: string, variantId: string | undefined, quantity: number, session?: any): Promise<void> {
    if (variantId) {
      const product = await ProductModel.findOne({ _id: productId }).session(session || null).lean().exec() as any;
      if (!product) return;

      const variant = product.variants?.find((v: any) => v.id === variantId || v.sku === variantId);
      if (!variant) return;

      const matchKey = variant.sku ? "sku" : "id";
      const matchValue = variant.sku || variant.id;

      await ProductModel.updateOne(
        { 
          _id: productId, 
          variants: { $elemMatch: { [matchKey]: matchValue } } 
        },
        { 
          $inc: { "variants.$.stock": quantity },
          $set: { stockStatus: 1 }
        }
      ).session(session || null).exec();
    } else {
      await ProductModel.updateOne(
        { _id: productId },
        { 
          $inc: { qty: quantity },
          $set: { stockStatus: 1 }
        }
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
   * Updates product average rating and review count.
   */
  static async updateRatingStats(productId: string, avgRating: number, reviewCount: number): Promise<void> {
    await ProductModel.updateOne({ _id: productId }, { avgRating, reviewCount }).exec();
  }

  /**
   * Deletes a product.
   */
  static async delete(id: string): Promise<void> {
    await ProductModel.findByIdAndDelete(id).exec();
  }
}
