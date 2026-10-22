import { meiliClient } from "../../core/search/meilisearch";
import { CategoryRepository } from "../category/category.repository";
import { resolveFuzzySearchTerms } from "../../core/utils/fuzzySearch";

export class SearchService {
  static async suggest(query: string) {
    let productHits: any[] = [];
    const { terms, correctedTerms, isCorrected, correctedQuery } = resolveFuzzySearchTerms(query);

    // 1. Try Meilisearch first if available
    if (meiliClient) {
      try {
        const searchQuery = isCorrected ? `${query} ${correctedQuery}` : query;
        const productSearch = await meiliClient.index("products").search(searchQuery, {
          limit: 15,
          attributesToRetrieve: ["id", "name", "slug", "brand", "thumbnail", "basePrice", "specialPrice"],
        });
        const rawHits = productSearch.hits || [];

        if (rawHits.length > 0) {
          const ids = rawHits.map((p) => p.id);
          const { ProductModel } = await import("../product/product.model");
          const inStockProducts = await ProductModel.find({
            _id: { $in: ids },
            $or: [
              { stockStatus: { $ne: 0 } },
              { allowBackorders: true },
              { "variants.stock": { $gt: 0 } },
            ],
          }).select("_id").lean().exec();

          const inStockSet = new Set(inStockProducts.map((p: any) => p._id.toString()));
          productHits = rawHits.filter((p) => inStockSet.has(p.id)).slice(0, 6);
        }
      } catch (error) {
        // Meilisearch offline/error - gracefully proceed to MongoDB Atlas fallback
      }
    }

    // 2. MongoDB Atlas Direct Search Fallback with Typo-Tolerance (Zero Mock)
    // Runs if Meilisearch is offline, unconfigured, or returned 0 hits
    if (productHits.length === 0) {
      try {
        const { ProductModel } = await import("../product/product.model");

        if (terms.length > 0) {
          const conditions = terms.map((w, idx) => {
            const corrected = correctedTerms[idx] || w;
            const regexList = [
              new RegExp(w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i"),
            ];

            if (corrected.toLowerCase() !== w.toLowerCase()) {
              regexList.push(
                new RegExp(corrected.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i")
              );
            }

            return {
              $or: regexList.flatMap((rx) => [
                { name: { $regex: rx } },
                { brand: { $regex: rx } },
                { sku: { $regex: rx } },
                { magentoCategories: { $regex: rx } },
              ]),
            };
          });

          const mongoProducts = await ProductModel.find({
            $and: conditions,
            $or: [
              { stockStatus: { $ne: 0 } },
              { allowBackorders: true },
              { "variants.stock": { $gt: 0 } },
              { qty: { $gt: 0 } },
            ],
          })
            .select("name slug brand images image colorImages thumbnail basePrice specialPrice variants stockStatus")
            .limit(8)
            .lean()
            .exec();

          productHits = mongoProducts.map((p: any) => {
            let effectivePrice = p.specialPrice || p.basePrice || 0;
            if (!effectivePrice && Array.isArray(p.variants) && p.variants.length > 0) {
              effectivePrice = p.variants[0].price || 0;
            }

            let imgUrl = p.thumbnail || p.image || "";
            if (!imgUrl && p.images && Array.isArray(p.images) && p.images.length > 0) {
              const first = p.images[0];
              imgUrl = typeof first === "string" ? first : (first?.url || "");
            }
            if (!imgUrl && p.colorImages && typeof p.colorImages === "object") {
              const colorVals = Object.values(p.colorImages);
              if (colorVals.length > 0 && typeof colorVals[0] === "string") {
                imgUrl = colorVals[0] as string;
              }
            }

            return {
              id: p._id.toString(),
              name: p.name,
              slug: p.slug,
              brand: p.brand || "",
              thumbnail: imgUrl,
              basePrice: p.basePrice || effectivePrice,
              specialPrice: p.specialPrice && p.specialPrice < (p.basePrice || 0) ? p.specialPrice : (p.basePrice || effectivePrice),
              inStock: p.stockStatus !== 0,
            };
          });
        }
      } catch (err) {
        console.error("MongoDB suggest fallback error:", err);
      }
    }

    // 3. Search categories in MongoDB (with typo tolerance)
    let matchedCategories: any[] = [];
    try {
      const categories = await CategoryRepository.findAll();
      const lowerQuery = query.toLowerCase().trim();
      const lowerCorrected = correctedQuery.toLowerCase().trim();

      matchedCategories = categories
        .filter((c) => {
          const cName = c.name.toLowerCase();
          const cSlug = c.slug.toLowerCase();
          return (
            cName.includes(lowerQuery) ||
            cSlug.includes(lowerQuery) ||
            (isCorrected && (cName.includes(lowerCorrected) || cSlug.includes(lowerCorrected)))
          );
        })
        .slice(0, 4)
        .map((c) => ({
          id: c._id.toString(),
          name: c.name,
          slug: c.slug,
        }));
    } catch {
      // Ignore category search error
    }

    // 4. Discover matching brands (with typo tolerance)
    let matchedBrands: string[] = [];
    try {
      const { ProductModel } = await import("../product/product.model");
      const escapedOriginal = query.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const escapedCorrected = correctedQuery.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

      const brandRegexes = [new RegExp(escapedOriginal, "i")];
      if (isCorrected) {
        brandRegexes.push(new RegExp(escapedCorrected, "i"));
      }

      const distinctBrands = await ProductModel.distinct("brand", {
        $or: brandRegexes.map((rx) => ({ brand: { $regex: rx } })),
      });
      matchedBrands = distinctBrands.filter(Boolean).slice(0, 3);
    } catch {
      // Ignore brand error
    }

    return {
      products: productHits,
      categories: matchedCategories,
      brands: matchedBrands,
      isCorrected,
      correctedQuery: isCorrected ? correctedQuery : undefined,
    };
  }

  /**
   * Returns dynamic trending/popular searches and quick browse categories.
   * Priority:
   * 1. Admin-curated popularSearches from SettingModel (if set)
   * 2. Live database aggregation from top categories and active brands (Zero Mock)
   */
  static async getTrendingSearches() {
    let trendingTerms: string[] = [];

    // 1. Check if Admin curated custom popularSearches in SettingModel
    try {
      const { SettingModel } = await import("../settings/setting.model");
      const settings: any = await SettingModel.findOne().select("popularSearches").lean().exec();
      if (settings?.popularSearches && Array.isArray(settings.popularSearches) && settings.popularSearches.length > 0) {
        trendingTerms = settings.popularSearches.filter(Boolean);
      }
    } catch (e) {
      // Ignore settings fetch error
    }

    // 2. Dynamic catalog aggregation if not set or sparse
    if (trendingTerms.length < 5) {
      try {
        const { CategoryRepository } = await import("../category/category.repository");
        const { ProductModel } = await import("../product/product.model");

        // Fetch top active categories
        const categories = await CategoryRepository.findAll();
        const topCategoryNames = categories
          .filter((c: any) => c.status !== "inactive" && !c.name.toLowerCase().includes("default"))
          .slice(0, 5)
          .map((c: any) => c.name);

        // Fetch top brands with active in-stock products
        const topBrands = await ProductModel.distinct("brand", {
          brand: { $ne: null },
          stockStatus: { $ne: 0 },
        });
        const cleanBrands = topBrands.filter(Boolean).slice(0, 5);

        // Merge without duplicates
        const combined = Array.from(new Set([...trendingTerms, ...topCategoryNames, ...cleanBrands]));
        trendingTerms = combined.slice(0, 10);
      } catch (err) {
        console.error("Dynamic trending fallback error:", err);
      }
    }

    // 3. Quick Browse Categories (Top 4 active categories with name and slug)
    let quickCategories: { name: string; slug: string }[] = [];
    try {
      const { CategoryRepository } = await import("../category/category.repository");
      const categories = await CategoryRepository.findAll();
      quickCategories = categories
        .filter((c: any) => c.status !== "inactive" && !c.name.toLowerCase().includes("default"))
        .slice(0, 4)
        .map((c: any) => ({
          name: c.name,
          slug: c.slug,
        }));
    } catch {
      // Fallback
    }

    return {
      trending: trendingTerms,
      categories: quickCategories,
    };
  }
}
