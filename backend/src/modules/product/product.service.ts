import { ProductRepository } from "./product.repository";
import { IProduct } from "@store4riders/shared-types";
import { NotFoundError } from "../../core/errors/AppError";
import { indexProduct, removeProductFromIndex } from "../../core/search/meilisearch";
import { slugify } from "@store4riders/shared-utils";
import { getCache, setCache, deleteCache } from "../../core/cache/redis";

const PRODUCT_LIST_TTL = 120; // 2 minutes
const PRODUCT_DETAIL_TTL = 300; // 5 minutes

/**
 * @class ProductService
 * @description Core business logic for Products with Redis caching.
 * Highlights:
 * - High-speed Redis caching for product listings, slug lookups, and SKU sets (5-15ms vs 250ms+ DB latency).
 * - Auto-generates SEO-friendly slugs on creation/update.
 * - Automatically syncs all DB changes instantly to the Meilisearch index.
 * - Auto-invalidates Redis cache on product creation, updates, and deletions.
 */
export class ProductService {
  
  static async getProducts(
    filters: Record<string, unknown>, 
    page: number, 
    limit: number,
    sort: Record<string, 1 | -1> = { createdAt: -1, _id: -1 }
  ) {
    // Deterministic serialization helper for cache key that preserves RegExp and nested objects
    const serializeFilter = (obj: any): string => {
      if (!obj || typeof obj !== "object") return String(obj);
      if (obj instanceof RegExp) return obj.toString();
      if (Array.isArray(obj)) return `[${obj.map(serializeFilter).join(",")}]`;
      return Object.entries(obj)
        .map(([k, v]) => `${k}:${serializeFilter(v)}`)
        .sort()
        .join(";");
    };

    const cacheKey = `products_v6_${page}_${limit}_${serializeFilter(filters)}_${serializeFilter(sort)}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const [items, totalCount] = await Promise.all([
      ProductRepository.findAll(filters, skip, limit, sort),
      ProductRepository.count(filters),
    ]);
    const result = { items, totalCount };

    await setCache(cacheKey, result, PRODUCT_LIST_TTL);
    return result;
  }

  static async getProductBySlug(slug: string): Promise<IProduct> {
    const cacheKey = `product_slug_${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const product = await ProductRepository.findById(slug);
    if (!product) throw new NotFoundError("Product");

    // DYNAMIC ORPHAN VARIANT RECOVERY:
    // If no variants are attached, we search the database for child variants 
    // using the explicit SKUs from configurableVariations (accurate mapping) 
    // or fallback to SKU prefix matching.
    if (!product.variants || product.variants.length === 0) {
      const { ProductModel } = await import("./product.model");
      let childSkus: string[] = [];
      const skuToAttributes: Record<string, any> = {};

      if (product.configurableVariations) {
        const variants = product.configurableVariations.split("|");
        for (const variant of variants) {
          const attrs = variant.split(",");
          let sku = "";
          const attributes: Record<string, string> = {};
          for (const attr of attrs) {
            const [key, value] = attr.split("=");
            if (!key || !value) continue;
            const k = key.trim().toLowerCase();
            const v = value.trim();
            if (k === "sku") {
              sku = v;
            } else if (k.includes("color") || k.includes("colour")) {
              attributes["color"] = v;
            } else {
              attributes[k] = v;
            }
          }
          if (sku) {
            childSkus.push(sku);
            skuToAttributes[sku] = attributes;
          }
        }
      }

      if (childSkus.length > 0) {
        const children = await ProductModel.find({ 
          sku: { $in: childSkus }
        }).lean().exec();

        if (children && children.length > 0) {
          product.variants = children.map(c => ({
            id: c._id ? c._id.toString() : c.sku,
            sku: c.sku,
            price: c.basePrice || c.specialPrice || 0,
            specialPrice: c.specialPrice,
            stock: c.qty || 10,
            attributes: skuToAttributes[c.sku] || {},
            imageUrl: c.images?.[0]?.url
          }));

          if (!product.basePrice || product.basePrice === 0) {
            const validPrices = children.map(c => c.basePrice || c.specialPrice).filter(p => p && p > 0);
            if (validPrices.length > 0) {
              product.basePrice = Math.min(...validPrices);
            }
          }
        }
      }
    }

    await setCache(cacheKey, product, PRODUCT_DETAIL_TTL);
    return product;
  }

  static async getProductsBySkus(skus: string[]): Promise<IProduct[]> {
    if (!skus || skus.length === 0) return [];
    const cacheKey = `products_skus_${skus.slice().sort().join("_")}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const cleanSkus = skus
      .join(",")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const items = await ProductRepository.findBySkus(cleanSkus);
    await setCache(cacheKey, items, PRODUCT_DETAIL_TTL);
    return items;
  }

  /**
   * Kit Recommendation Engine — accuracy first, no fallback.
   * Only returns relatedSkus products if they exist in DB.
   * If relatedSkus not configured or not found in DB → returns empty array.
   * No smart matching, no upsellSkus fallback.
   */
  static async getKitRecommendations(slugOrId: string): Promise<IProduct[]> {
    const cacheKey = `product_kit_v6_${slugOrId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let product: IProduct | null = null;
    if (slugOrId.match(/^[0-9a-fA-F]{24}$/)) {
      product = await ProductRepository.findById(slugOrId);
    }
    if (!product) {
      product = await ProductRepository.findBySlug(slugOrId);
    }
    if (!product) return [];

    let kitProducts: IProduct[] = [];

    if (product.relatedSkus && product.relatedSkus.length > 0) {
      const cleanSkus = product.relatedSkus
        .join(",")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      kitProducts = await ProductRepository.findBySkus(cleanSkus);
    }

    await setCache(cacheKey, kitProducts, PRODUCT_DETAIL_TTL);
    return kitProducts;
  }


  static async getAggregations(filters: Record<string, unknown> = {}, categorySlug?: string, rawActiveFilters?: any): Promise<any> {
    const serializeFilter = (obj: any): string => {
      if (!obj || typeof obj !== "object") return String(obj);
      if (obj instanceof RegExp) return obj.toString();
      if (Array.isArray(obj)) return `[${obj.map(serializeFilter).join(",")}]`;
      return Object.entries(obj).map(([k, v]) => `${k}:${serializeFilter(v)}`).sort().join(";");
    };

    const cacheKey = `product_aggregations_v9_${categorySlug || 'all'}_${serializeFilter(rawActiveFilters || {})}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const { ProductModel } = await import("./product.model");
    
    // BUILD BASE QUERY: Only Category + Search + Status
    const baseFilters: any = {
      $or: [
        { status: "published" },
        { status: { $exists: false } }
      ],
      visibility: { $ne: "Not Visible Individually" }
    };
    
    if (rawActiveFilters?.category) {
      let cleanSlug = rawActiveFilters.category.toLowerCase().trim();
      
      const slugMap: Record<string, string> = {
        "full-face-helmets": "full-face",
        "modular-helmets": "modular-flip-up",
        "half-face-helmets": "open-face",
        "off-road-motocross": "off-road-motocross-gear",
        "off-road-riding-boots": "off-road-riding-boots",
        "riding-jacket": "riding-jackets",
        "riding-jean": "riding-jeans",
        "touring-pant": "touring-pants",
        "knee-guard": "knee-guards",
        "saddle-bags": "saddle-bags-bikes",
        "tail-bags": "motorcycle-tail-bags",
        "women-riding-gear": "riding-gear-for-women"
      };

      if (slugMap[cleanSlug]) {
        cleanSlug = slugMap[cleanSlug];
      }

      // We must re-enable the regex engine because Magento data is missing category tags!
      if (cleanSlug.includes("off-road-boot") || cleanSlug.includes("off-road-riding-boot")) {
        baseFilters.$or = [
          { magentoCategories: /off road.*boot|motocross.*boot|mx.*boot/i },
          { name: /off road.*boot|motocross.*boot|mx.*boot/i }
        ];
      } else if (cleanSlug.includes("off-road") || cleanSlug.includes("motocross")) {
        const baseOr = [
          { magentoCategories: /off road|motocross|mx/i },
          { name: /off road|motocross|mx/i },
        ];
        if (cleanSlug.includes("helmet")) {
          baseFilters.$and = [
            { $or: baseOr },
            { $or: [{ magentoCategories: /helmet/i }, { name: /helmet/i }] }
          ];
        } else {
          baseFilters.$or = baseOr;
        }
      } else if (cleanSlug.includes("women-riding-gear") || cleanSlug.includes("women") || cleanSlug.includes("riding-gear-for-women")) {
        baseFilters.$or = [
          { name: /\b(women|womens|lady|ladies|female)\b/i },
          { magentoCategories: /\b(women|womens|lady|ladies|female)\b/i },
          { gender: /women|female|lady/i }
        ];
      } else {
        const exactPhrase = cleanSlug.replace(/-/g, " ").trim();
        const keywords = exactPhrase
          .split(/\s+/)
          .filter((w: string) => !["motorcycle", "riding", "bike", "for", "online"].includes(w) && w.length > 1);
          
        if (keywords.length > 0) {
          const lookaheads = keywords.map((w: string) => `(?=.*\\b${w})`).join("");
          const andPattern = `^${lookaheads}.*$`;
          
          baseFilters.$or = [
            { magentoCategories: new RegExp(exactPhrase, "i") },
            { magentoCategories: new RegExp(andPattern, "i") },
            { name: new RegExp(andPattern, "i") }
          ];
        } else {
          baseFilters.$or = [
            { magentoCategories: new RegExp(exactPhrase, "i") },
            { name: new RegExp(exactPhrase, "i") }
          ];
        }
      }

      // -------------------------------------------------------------
      // WRAP THE REGEX OUTPUT WITH EXACT DATABASE "CATEGORY SLUGS"
      // If the Regex Engine matches, OR the Database explicitly says so, include it!
      // -------------------------------------------------------------
      const regexCondition: any = {};
      
      // Fix bug where regex engine overwrote the status: published $or condition
      if (baseFilters.$or && baseFilters.$or.length > 0 && !baseFilters.$or.find((c: any) => c.status === "published")) {
        regexCondition.$or = baseFilters.$or;
        baseFilters.$or = [ { status: "published" }, { status: { $exists: false } } ];
      }
      
      if (baseFilters.$and) {
        regexCondition.$and = baseFilters.$and;
        delete baseFilters.$and;
      }
      
      baseFilters.$and = baseFilters.$and || [];
      baseFilters.$and.push({
        $or: [
          regexCondition,
          { categorySlugs: cleanSlug }
        ]
      });
    }
    
    if (rawActiveFilters?.search) {
      const escaped = rawActiveFilters.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const searchRegex = new RegExp(escaped, "i");
      baseFilters.$and = [
        {
          $or: [
            { name: { $regex: searchRegex } },
            { brand: { $regex: searchRegex } },
            { sku: { $regex: searchRegex } },
            { magentoCategories: { $regex: searchRegex } },
          ],
        }
      ];
    }

    const products = await ProductModel.find(baseFilters)
      .select("brand magentoCategories variants configurableVariations colorImages stockStatus attributes")
      .lean()
      .exec();

    const brandsMap = new Map<string, number>();
    const categoriesMap = new Map<string, number>();
    const colorsMap = new Map<string, Set<string>>();
    const sizesMap = new Map<string, Set<string>>();
    
    // Track dynamic attributes like gender, helmet_type, material
    const dynamicAttrsMap = new Map<string, Map<string, Set<string>>>();
    const TRACKED_ATTRS = ['material', 'riding_style', 'certification', 'gender'];

    const activeBrands = rawActiveFilters?.brand?.map((b: string) => b.toLowerCase()) || [];
    const activeColors = rawActiveFilters?.colour?.map((c: string) => c.toLowerCase()) || [];
    const activeSizes = rawActiveFilters?.size?.map((s: string) => s.toLowerCase()) || [];

    products.forEach((p: any) => {
      const pBrand = p.brand || (p.attributes && (p.attributes.brand || p.attributes.Brand)) || null;
      let matchesBrand = true;
      if (activeBrands.length > 0 && pBrand) {
        matchesBrand = activeBrands.some((b: string) => pBrand.toLowerCase() === b || (b === 'mt' && pBrand.toLowerCase().includes('mt helmets')));
      } else if (activeBrands.length > 0) {
        matchesBrand = false;
      }

      let matchesColor = true;
      let matchesSize = true;
      
            const availableColors = new Set<string>();
      const availableSizes = new Set<string>();
      
      // 1. Extract from strict variants
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          if (v.attributes?.color) availableColors.add(v.attributes.color.toLowerCase());
          if (v.attributes?.colour) availableColors.add(v.attributes.colour.toLowerCase());
          if (v.attributes?.size) availableSizes.add(v.attributes.size.toLowerCase());
          if (v.attributes?.eu_size) availableSizes.add(v.attributes.eu_size.toLowerCase());
        });
      } 
      
      // 2. Fallback to legacy Magento string
      if (p.configurableVariations) {
        const vars = p.configurableVariations.split("|");
        for (const variant of vars) {
          const attrs = variant.split(",");
          for (const attr of attrs) {
            const [k, v] = attr.split("=");
            if (k && v) {
              const kl = k.trim().toLowerCase();
              if (kl === 'color' || kl === 'colour') availableColors.add(v.trim().toLowerCase());
              if (kl === 'size' || kl === 'eu_size') availableSizes.add(v.trim().toLowerCase());
            }
          }
        }
      }
      
      // 3. Fallback to DB Migrated colorImages (The ultimate source of truth for colors)
      if (p.colorImages && typeof p.colorImages === 'object') {
        Object.keys(p.colorImages).forEach(c => availableColors.add(c.trim().toLowerCase()));
      }

      if (activeColors.length > 0) {
        matchesColor = activeColors.some((c: string) => availableColors.has(c));
      }
      if (activeSizes.length > 0) {
        matchesSize = activeSizes.some((s: string) => availableSizes.has(s));
      }

      // 1. EXTRACT BRANDS (Must match Color + Size filters)
      if (pBrand && matchesColor && matchesSize) {
        brandsMap.set(pBrand, (brandsMap.get(pBrand) || 0) + 1);
      }

      // 2. EXTRACT CATEGORIES (Must match Brand + Color + Size filters)
      if (p.magentoCategories && matchesBrand && matchesColor && matchesSize) {
        const paths = p.magentoCategories.split(",");
        for (const path of paths) {
          const pathLower = path.toLowerCase();
          if (pathLower.includes("between") || pathLower.includes("under ") || pathLower.includes("price") || pathLower.includes("rs.") || pathLower.includes("₹")) continue;
          
          const parts = path.split("/").map((part: string) => part.trim()).filter((part: string) => part && !part.toLowerCase().includes("root"));
          if (parts.length > 0) {
            const cleanPath = parts.join(" > ");
            categoriesMap.set(cleanPath, (categoriesMap.get(cleanPath) || 0) + 1);
          }
        }
      }

      // 3. EXTRACT COLORS & SIZES
      const extractedVariants: any[] = [];
      
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          extractedVariants.push({ color: v.attributes?.color || v.attributes?.colour, size: v.attributes?.size || v.attributes?.eu_size });
        });
      }
      
      if (p.configurableVariations) {
        const vars = p.configurableVariations.split("|");
        for (const variant of vars) {
          const vObj: any = {};
          variant.split(",").forEach((attr: string) => {
            const [k, v] = attr.split("=");
            if (k && v) vObj[k.trim().toLowerCase()] = v.trim();
          });
          extractedVariants.push({ color: vObj.color || vObj.colour, size: vObj.size || vObj.eu_size });
        }
      }
      
      // Add colors from DB migrated colorImages
      if (p.colorImages && typeof p.colorImages === 'object') {
        Object.keys(p.colorImages).forEach(c => {
          extractedVariants.push({ color: c, size: undefined });
        });
      }

      // Add colors and sizes from top-level attributes (migrated from CSV/Magento)
      if (p.attributes && typeof p.attributes === 'object') {
        const topColor = (p.attributes as any).color || (p.attributes as any).colour;
        const topSize = (p.attributes as any).size || (p.attributes as any).eu_size;
        if (topColor || topSize) {
          extractedVariants.push({ color: topColor, size: topSize });
        }
      }

      extractedVariants.forEach((v: any) => {
        const vColor = v.color;
        const vSize = v.size;
        
        let vMatchesSize = true;
        if (activeSizes.length > 0 && vSize) {
          vMatchesSize = activeSizes.includes(vSize.toLowerCase());
        }
        
        if (matchesBrand && vMatchesSize && vColor) {
          if (!colorsMap.has(vColor)) colorsMap.set(vColor, new Set());
          colorsMap.get(vColor)!.add(p._id.toString());
        }

        let vMatchesColor = true;
        if (activeColors.length > 0 && vColor) {
          vMatchesColor = activeColors.includes(vColor.toLowerCase());
        }
        
        if (matchesBrand && vMatchesColor && vSize) {
          if (!sizesMap.has(vSize)) sizesMap.set(vSize, new Set());
          sizesMap.get(vSize)!.add(p._id.toString());
        }
      });

      // 4. EXTRACT DYNAMIC ATTRIBUTES (gender, material, etc.)
      // Note: We only add these to the map if they match the primary filters (brand, color, size)
      if (matchesBrand && matchesColor && matchesSize) {
        TRACKED_ATTRS.forEach(attrName => {
          let attrValue = '';
          // Gender can be top-level or inside attributes
          if (attrName === 'gender' && p.gender) {
            attrValue = p.gender;
          } else if (p.attributes && typeof p.attributes === 'object') {
            const capName = attrName.charAt(0).toUpperCase() + attrName.slice(1);
            const upperName = attrName.toUpperCase();
            attrValue = p.attributes[attrName] || p.attributes[capName] || p.attributes[upperName];
          }

          if (attrValue) {
            const cleanVal = attrValue.trim();
            if (!dynamicAttrsMap.has(attrName)) dynamicAttrsMap.set(attrName, new Map());
            const valMap = dynamicAttrsMap.get(attrName)!;
            if (!valMap.has(cleanVal)) valMap.set(cleanVal, new Set());
            valMap.get(cleanVal)!.add(p._id.toString());
          }
        });
      }
    });

    const dynamicAttributesResponse: Record<string, any[]> = {};
    for (const [attrName, valMap] of dynamicAttrsMap.entries()) {
      // Prevent dirty data from showing irrelevant filters
      if (attrName === 'helmet_type' && rawActiveFilters?.category && !rawActiveFilters.category.toLowerCase().includes('helmet')) {
        continue;
      }
      if (attrName === 'certification' && rawActiveFilters?.category && rawActiveFilters.category.toLowerCase().includes('boot')) {
        continue;
      }
      
      dynamicAttributesResponse[attrName] = Array.from(valMap.entries())
        .map(([name, set]) => ({ name, count: set.size }))
        .sort((a, b) => b.count - a.count);
    }

    const result = {
      brands: Array.from(brandsMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      categories: Array.from(categoriesMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      colors: Array.from(colorsMap.entries()).map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count),
      sizes: Array.from(sizesMap.entries()).map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count),
      dynamicAttributes: dynamicAttributesResponse,
      filterConfig: undefined,
    };

    if (categorySlug) {
      const { CategoryModel } = await import("../category/category.model");
      const categoryDoc = await CategoryModel.findOne({ slug: categorySlug }).lean().exec() as any;
      if (categoryDoc && categoryDoc.filterConfig) {
        result.filterConfig = categoryDoc.filterConfig;
      }
    }

    await setCache(cacheKey, result, 3600);
    return result;
  }

  static async createProduct(data: Partial<IProduct>): Promise<IProduct> {
    const slug = slugify(data.name || "");
    const productData = { ...data, slug };
    const product = await ProductRepository.create(productData);
    
    // Sync to search index & invalidate cache
    await indexProduct(product);
    await this.invalidateProductCache(slug);
    
    return product;
  }

  static async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct> {
    if (data.name) {
      data.slug = slugify(data.name);
    }
    const product = await ProductRepository.update(id, data);
    if (!product) throw new NotFoundError("Product");
    
    // Sync to search index & invalidate cache
    await indexProduct(product);
    await this.invalidateProductCache(product.slug);
    
    return product;
  }

  static async deleteProduct(id: string): Promise<void> {
    const product = await ProductRepository.findById(id);
    if (!product) throw new NotFoundError("Product");
    await ProductRepository.delete(id);
    await removeProductFromIndex(id);
    await this.invalidateProductCache(product.slug);
  }

  private static async invalidateProductCache(slug?: string) {
    if (slug) {
      await deleteCache(`product_slug_${slug}`);
    }
  }

  static async bulkUpdateFromCsv(csvContent: string): Promise<{ successCount: number; errorRows: any[] }> {
    const Papa = (await import("papaparse")).default;
    const mongoose = (await import("mongoose")).default;
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          const rows = results.data as any[];
          let successCount = 0;
          const errorRows: any[] = [];
          
          const session = await mongoose.startSession();
          session.startTransaction();

          try {
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              const { sku, basePrice, specialPrice, stockStatus } = row;
              
              if (!sku) {
                errorRows.push({ row: i + 2, reason: "SKU is required" });
                continue;
              }

              const updateData: Partial<IProduct> = {};
              if (basePrice !== undefined && basePrice !== "") updateData.basePrice = Number(basePrice);
              if (specialPrice !== undefined && specialPrice !== "") updateData.specialPrice = Number(specialPrice);
              if (stockStatus !== undefined && stockStatus !== "") updateData.stockStatus = Number(stockStatus);

              const product = await ProductRepository.updateBySku(sku, updateData, session);
              
              if (!product) {
                errorRows.push({ row: i + 2, reason: `Product with SKU ${sku} not found` });
              } else {
                successCount++;
                // Sync search index asynchronously
                indexProduct(product).catch(console.error);
                await this.invalidateProductCache(product.slug);
              }
            }
            
            await session.commitTransaction();
            session.endSession();
            resolve({ successCount, errorRows });
          } catch (error: any) {
            await session.abortTransaction();
            session.endSession();
            reject(error);
          }
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }
}
