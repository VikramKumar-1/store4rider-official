import { meiliClient } from "../../core/search/meilisearch";
import { CategoryRepository } from "../category/category.repository";

export class SearchService {
  static async suggest(query: string) {
    if (!meiliClient) {
      return { products: [], categories: [] };
    }

    // 1. Search products in Meilisearch
    let productHits: any[] = [];
    try {
      const productSearch = await meiliClient.index("products").search(query, {
        limit: 15,
        attributesToRetrieve: ["id", "name", "slug", "brand", "thumbnail", "basePrice", "specialPrice"],
      });
      productHits = productSearch.hits;

      if (productHits.length > 0) {
        const ids = productHits.map((p) => p.id);
        const { ProductModel } = await import("../product/product.model");
        const inStockProducts = await ProductModel.find({
          _id: { $in: ids },
          $or: [
            { stockStatus: { $ne: 0 } },
            { allowBackorders: true }
          ]
        }).select("_id").lean().exec();
        
        const inStockSet = new Set(inStockProducts.map((p: any) => p._id.toString()));
        productHits = productHits.filter((p) => inStockSet.has(p.id)).slice(0, 5);
      }
    } catch (error) {
      console.error("Meilisearch search error:", error);
    }

    // 2. Search categories in MongoDB (simple regex search for categories)
    // We only need top 3 category matches
    const categories = await CategoryRepository.findAll();
    const matchedCategories = categories
      .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map((c) => ({
        id: c._id.toString(),
        name: c.name,
        slug: c.slug,
      }));

    return {
      products: productHits,
      categories: matchedCategories,
    };
  }
}
