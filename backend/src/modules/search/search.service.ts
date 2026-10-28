import { meiliClient } from "../../core/search/meilisearch";
import { CategoryRepository } from "../category/category.repository";
import { resolveFuzzySearchTerms, getGearAccessoryExclusion } from "../../core/utils/fuzzySearch";

const STOREFRONT_CANONICAL_CATEGORIES = [
  { name: "Motorcycle Helmets", slug: "motorcycle-helmets", url: "/motorcycle-helmets", keywords: ["helmet", "helmets", "headgear", "motorcycle helmet"] },
  { name: "Full Face Helmets", slug: "full-face-helmets", url: "/motorcycle-helmets/full-face-helmets", keywords: ["full face"] },
  { name: "Modular Helmets", slug: "modular-helmets", url: "/motorcycle-helmets/modular-helmets", keywords: ["modular", "flip up"] },
  { name: "Off Road Helmets", slug: "off-road-helmets", url: "/motorcycle-helmets/off-road-helmets", keywords: ["off road helmet", "motocross"] },
  { name: "Open Face Helmets", slug: "open-face-helmets", url: "/motorcycle-helmets/open-face-helmets", keywords: ["open face", "half face"] },
  { name: "Helmet Accessories & Visors", slug: "helmet-accessories", url: "/motorcycle-helmets/helmet-accessories", keywords: ["visor", "visors", "pinlock", "helmet accessories"] },
  { name: "Bluetooth Intercoms", slug: "bluetooth-intercoms", url: "/motorcycle-helmets/bluetooth-intercoms", keywords: ["intercom", "bluetooth", "communicator", "cardo", "sena"] },
  { name: "Balaclava", slug: "balaclava", url: "/motorcycle-helmets/balaclava", keywords: ["balaclava", "buff", "face mask"] },
  { name: "Riding Gear", slug: "riding-gear", url: "/riding-gear", keywords: ["riding gear", "biker gear"] },
  { name: "Riding Jackets", slug: "riding-jackets", url: "/riding-gear/riding-jackets", keywords: ["jacket", "jackets", "riding jacket", "biker jacket"] },
  { name: "Protectors / Armour", slug: "protectors-armour", url: "/riding-gear/riding-jackets/protectors-armour", keywords: ["armour", "armor", "protector", "chest guard"] },
  { name: "Riding Pants", slug: "riding-pants", url: "/riding-gear/riding-pants", keywords: ["pant", "pants", "riding pant", "trouser"] },
  { name: "Riding Jeans", slug: "motorcycle-riding-jeans", url: "/riding-gear/riding-pants/motorcycle-riding-jeans", keywords: ["jeans", "riding jeans"] },
  { name: "Touring Pants", slug: "touring-pants", url: "/riding-gear/riding-pants/touring-pants", keywords: ["touring pant"] },
  { name: "Knee Guards", slug: "knee-guards-bikers", url: "/riding-gear/riding-pants/knee-guards-bikers", keywords: ["knee guard", "knee guards"] },
  { name: "Riding Gloves", slug: "riding-gloves", url: "/riding-gear/riding-gloves", keywords: ["glove", "gloves", "riding glove"] },
  { name: "Full Gauntlet Gloves", slug: "full-gauntlet-gloves", url: "/riding-gear/riding-gloves/full-gauntlet-gloves", keywords: ["full gauntlet"] },
  { name: "Semi Gauntlet Gloves", slug: "semi-gauntlet-gloves", url: "/riding-gear/riding-gloves/semi-gauntlet-gloves", keywords: ["semi gauntlet"] },
  { name: "Short Motorbike Gloves", slug: "short-motorbike-gloves", url: "/riding-gear/riding-gloves/short-motorbike-gloves", keywords: ["short glove"] },
  { name: "Motorcycle Riding Boots", slug: "motorcycle-riding-boots", url: "/riding-gear/motorcycle-riding-boots", keywords: ["boot", "boots", "riding boot", "shoe", "shoes"] },
  { name: "Sports Riding Shoes", slug: "sports-riding-shoes", url: "/riding-gear/motorcycle-riding-boots/sports-riding-shoes", keywords: ["sports shoe", "riding shoe"] },
  { name: "Short Biking Boots", slug: "short-biking-boots", url: "/riding-gear/motorcycle-riding-boots/short-biking-boots", keywords: ["short boot"] },
  { name: "Off Road Boots", slug: "off-road-riding-boots", url: "/riding-gear/motorcycle-riding-boots/off-road-riding-boots", keywords: ["off road boot"] },
  { name: "Luggage & Bags", slug: "motorcycle-bags-bike-luggage", url: "/motorcycle-bags-bike-luggage", keywords: ["luggage", "bag", "bags"] },
  { name: "Tank Bags", slug: "tank-bags-bikes", url: "/motorcycle-bags-bike-luggage/tank-bags-bikes", keywords: ["tank bag", "tankbag"] },
  { name: "Saddle Bags", slug: "saddle-bags-bikes", url: "/motorcycle-bags-bike-luggage/saddle-bags-bikes", keywords: ["saddle bag", "saddlebag", "pannier"] },
  { name: "Motorcycle Tail Bags", slug: "motorcycle-tail-bags", url: "/motorcycle-bags-bike-luggage/motorcycle-tail-bags", keywords: ["tail bag", "tailbag"] },
  { name: "Bike Accessories", slug: "motorcycle-accessories-online", url: "/motorcycle-accessories-online", keywords: ["accessory", "accessories"] },
  { name: "Spares & Parts", slug: "spares", url: "/spares", keywords: ["spare", "spares", "parts", "exhaust", "filter", "spark plug"] },
  { name: "Gadgets", slug: "gadgets", url: "/gadgets", keywords: ["gadget", "gadgets", "phone holder", "mobile mount"] },
];

export class SearchService {
  static async suggest(query: string) {
    let productHits: any[] = [];
    const { terms, correctedTerms, isCorrected, correctedQuery } = resolveFuzzySearchTerms(query);
    const effectiveTerms = correctedTerms.length > 0 ? correctedTerms : terms;
    const effectiveQuery = isCorrected ? correctedQuery : query.trim();

    const inStockCondition = {
      $or: [
        { allowBackorders: true },
        { "variants.stock": { $gt: 0 } },
        {
          $and: [
            { "variants.0": { $exists: false } },
            { stockStatus: { $ne: 0 } },
            { qty: { $gt: 0 } },
          ],
        },
      ],
    };

    // Helper to format product hit from MongoDB doc
    const mapProductHit = (p: any) => {
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

      const hasStock = Boolean(
        p.allowBackorders === true ||
        (Array.isArray(p.variants) && p.variants.some((v: any) => Number(v.stock) > 0)) ||
        (!p.variants?.length && p.stockStatus !== 0 && (p.qty === undefined || Number(p.qty) > 0))
      );

      return {
        id: (p._id || p.id).toString(),
        name: p.name,
        slug: p.slug,
        brand: p.brand || "",
        thumbnail: imgUrl,
        basePrice: p.basePrice || effectivePrice,
        specialPrice: p.specialPrice && p.specialPrice < (p.basePrice || 0) ? p.specialPrice : (p.basePrice || effectivePrice),
        inStock: Boolean(hasStock),
      };
    };

    // Helper to score products for maximum relevance & accuracy
    const scoreProduct = (p: any) => {
      let score = 10;
      const pName = (p.name || "").toLowerCase();
      const pBrand = (p.brand || "").toLowerCase();
      const lowerQuery = query.toLowerCase().trim();
      const lowerCorrected = correctedQuery.toLowerCase().trim();

      // Exact phrase match in title
      if (pName.startsWith(lowerQuery) || pName.startsWith(lowerCorrected)) {
        score += 80;
      } else if (pName.includes(lowerQuery) || pName.includes(lowerCorrected)) {
        score += 50;
      }

      // Brand match boost
      if (pBrand.includes(lowerQuery) || pBrand.includes(lowerCorrected)) {
        score += 35;
      }

      // Prioritize in-stock items
      const hasStock = Boolean(
        p.allowBackorders === true ||
        (Array.isArray(p.variants) && p.variants.some((v: any) => Number(v.stock) > 0)) ||
        (!p.variants?.length && p.stockStatus !== 0 && (p.qty === undefined || Number(p.qty) > 0))
      );
      if (hasStock) {
        score += 25;
      }

      // Configurable / Parent products preferred over standalone orphan items
      if (p.productType === "configurable") {
        score += 15;
      }

      // Sales count boost
      if (p.salesCount && p.salesCount > 0) {
        score += Math.min(p.salesCount, 15);
      }

      // Deprioritize small replacement parts/accessories if user searched for core gear
      const isCoreSearch = effectiveTerms.some((t) => /^(helmet|helmets|jacket|jackets|boot|boots|shoe|shoes|glove|gloves)$/i.test(t));
      if (isCoreSearch && /^(replacement|pinlock\s*\d+|spoiler|liner|deflector|air\s*vent|chin\s*curtain|ratchet|pivot|screw|pad)/i.test(pName)) {
        score -= 25;
      }

      return score;
    };

    // 1. Try Meilisearch first if available
    if (meiliClient) {
      try {
        const searchQuery = isCorrected ? `${query} ${correctedQuery}` : query;
        const productSearch = await meiliClient.index("products").search(searchQuery, {
          limit: 25,
          attributesToRetrieve: ["id", "name", "slug", "brand", "thumbnail", "basePrice", "specialPrice"],
        });
        const rawHits = productSearch.hits || [];

        if (rawHits.length > 0) {
          const ids = rawHits.map((p) => p.id);
          const { ProductModel } = await import("../product/product.model");

          const dbProducts = await ProductModel.find({
            _id: { $in: ids },
            visibility: { $nin: ["1", "Not Visible Individually"] },
            status: { $nin: ["draft", "archived"] },
            ...inStockCondition,
          })
            .select("name slug brand images image colorImages thumbnail basePrice specialPrice variants stockStatus salesCount productType qty allowBackorders")
            .lean()
            .exec();

          if (dbProducts.length > 0) {
            const scoredHits = dbProducts
              .map((p) => ({ product: p, score: scoreProduct(p) }))
              .sort((a, b) => b.score - a.score)
              .map((item) => mapProductHit(item.product))
              .filter((p) => p.inStock);

            productHits = scoredHits.slice(0, 6);
          }
        }
      } catch (error) {
        // Meilisearch offline/error - proceed to MongoDB Atlas
      }
    }

    // 2. MongoDB Atlas Direct Search (runs if Meilisearch offline or returned fewer than 4 items)
    if (productHits.length < 4) {
      try {
        const { ProductModel } = await import("../product/product.model");

        if (terms.length > 0) {
          const existingIds = new Set(productHits.map((h) => h.id));
          const conditions: any[] = terms.map((w, idx) => {
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
            $and: [
              ...conditions,
              inStockCondition,
              { visibility: { $nin: ["1", "Not Visible Individually"] } },
              { status: { $nin: ["draft", "archived"] } },
            ],
          })
            .select("name slug brand images image colorImages thumbnail basePrice specialPrice variants stockStatus salesCount productType qty allowBackorders")
            .limit(40)
            .lean()
            .exec();

          const scoredMongo = mongoProducts
            .filter((p: any) => !existingIds.has(p._id?.toString()))
            .map((p: any) => ({ product: p, score: scoreProduct(p) }))
            .sort((a, b) => b.score - a.score)
            .map((item) => mapProductHit(item.product))
            .filter((p) => p.inStock);

          productHits = [...productHits, ...scoredMongo].filter((p) => p.inStock).slice(0, 6);
        }
      } catch (err) {
        console.error("MongoDB suggest error:", err);
      }
    }

    // 3. Match Storefront Canonical Categories (Ensures 100% accurate category URLs)
    let matchedCategories: Array<{ id: string; name: string; slug: string; url: string }> = [];
    try {
      const lowerQuery = query.toLowerCase().trim();
      const lowerCorrected = correctedQuery.toLowerCase().trim();

      matchedCategories = STOREFRONT_CANONICAL_CATEGORIES.filter((cat) => {
        const nameMatch = cat.name.toLowerCase().includes(lowerQuery) || cat.name.toLowerCase().includes(lowerCorrected);
        const slugMatch = cat.slug.toLowerCase().includes(lowerQuery) || cat.slug.toLowerCase().includes(lowerCorrected);
        const keywordMatch = cat.keywords.some((kw) => kw.includes(lowerQuery) || lowerQuery.includes(kw));
        return nameMatch || slugMatch || keywordMatch;
      })
        .slice(0, 3)
        .map((c) => ({
          id: c.slug,
          name: c.name,
          slug: c.slug,
          url: c.url,
        }));
    } catch {
      // Ignore category search error
    }

    // 4. Discover matching brands (Direct brand match or Top brands with matching products)
    let matchedBrands: string[] = [];
    try {
      const { ProductModel } = await import("../product/product.model");
      const escapedOriginal = query.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const escapedCorrected = correctedQuery.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

      const brandRegexes = [new RegExp(escapedOriginal, "i")];
      if (isCorrected) {
        brandRegexes.push(new RegExp(escapedCorrected, "i"));
      }

      // Check for direct brand name matches (strictly in-stock products)
      let distinctBrands = await ProductModel.distinct("brand", {
        visibility: { $nin: ["1", "Not Visible Individually"] },
        status: { $nin: ["draft", "archived"] },
        ...inStockCondition,
        $or: brandRegexes.map((rx) => ({ brand: { $regex: rx } })),
      });

      // If no direct brand matches (e.g. user typed "helmet"), discover top brands selling the matching gear
      if (distinctBrands.filter(Boolean).length === 0 && terms.length > 0) {
        const gearBrandConditions: any[] = [
          {
            $or: terms.map((w) => ({
              $or: [
                { name: { $regex: new RegExp(w, "i") } },
                { magentoCategories: { $regex: new RegExp(w, "i") } },
              ],
            })),
          },
          { brand: { $ne: null, $nin: ["", "Other", "Generic"] } },
          inStockCondition,
          { visibility: { $nin: ["1", "Not Visible Individually"] } },
          { status: { $nin: ["draft", "archived"] } },
        ];
        distinctBrands = await ProductModel.distinct("brand", { $and: gearBrandConditions });
      }

      matchedBrands = distinctBrands.filter(Boolean).slice(0, 4);
    } catch {
      // Ignore brand error
    }

    // 5. Generate Flipkart / Amazon Style Scoped Intent Suggestions
    const scopedSuggestions: Array<{
      type: "category" | "brand";
      label: string;
      query: string;
      categorySlug?: string;
      categoryName?: string;
      brand?: string;
    }> = [];

    // Contextual category intents (e.g. "helmet in Full Face Helmets")
    for (const cat of matchedCategories.slice(0, 2)) {
      scopedSuggestions.push({
        type: "category",
        label: `${effectiveQuery} in ${cat.name}`,
        query: effectiveQuery,
        categorySlug: cat.slug,
        categoryName: cat.name,
      });
    }

    // Contextual brand intents (e.g. "helmet by Axor", "helmet by SMK")
    for (const b of matchedBrands.slice(0, 3)) {
      scopedSuggestions.push({
        type: "brand",
        label: `${effectiveQuery} by ${b}`,
        query: effectiveQuery,
        brand: b,
      });
    }

    return {
      products: productHits,
      categories: matchedCategories,
      brands: matchedBrands,
      scopedSuggestions,
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
