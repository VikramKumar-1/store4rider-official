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
        limit: 5,
        attributesToRetrieve: ["id", "name", "slug", "brand", "thumbnail", "basePrice", "specialPrice"],
      });
      productHits = productSearch.hits;
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
