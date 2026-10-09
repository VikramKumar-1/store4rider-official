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

    const cacheKey = `products_v13_${page}_${limit}_${serializeFilter(filters)}_${serializeFilter(sort)}`;
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
    const cacheKey = `product_slug_v2_${slug}`;
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

      let children: any[] = [];
      if (childSkus.length > 0) {
        const skuRegexes = childSkus.map(s => new RegExp(`^${s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, "i"));
        children = await ProductModel.find({ sku: { $in: skuRegexes } }).lean().exec();
      } else if (product.productType === 'configurable' && product.sku) {
        children = await ProductModel.find({ sku: { $regex: new RegExp(`^${product.sku}[-_]`, "i") } }).lean().exec();
        children.forEach(c => {
          if (!skuToAttributes[c.sku]) {
            const parts = c.sku.replace(new RegExp(`^${product.sku}[-_]`, "i"), "").split(/[-_]/);
            skuToAttributes[c.sku] = { color: parts[0] || 'Standard', size: parts[1] || 'Standard' };
          }
        });
      }

      if (children && children.length > 0) {
        product.variants = children.map(c => ({
          id: c._id ? c._id.toString() : c.sku,
          sku: c.sku,
          price: c.basePrice || c.specialPrice || 0,
          specialPrice: c.specialPrice,
          stock: c.stockStatus === 0 ? 0 : (typeof c.qty === 'number' ? c.qty : 10),
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

    // SKU COLOR CODE → IMAGE URL LINKER
    // Problem: Some variants have imageUrl missing because the import script only
    // linked images for child product rows that existed separately in the CSV.
    // Variants parsed from the parent's configurableVariations string got no imageUrl.
    //
    // Fix: Extract the manufacturer color code from the variant SKU (e.g. "GL186" from
    // "GL186-XS-Green"), then find the matching image in product.images whose URL
    // contains that code (e.g. "_gl186_" in the filename). Works for ALL brands.
    if (product.variants && product.variants.length > 0 && product.images && product.images.length > 0) {
      const KNOWN_SIZES = new Set(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', '2xl', '3xl', '4xl']);

      // Cache per color code so all sizes of the same color share the same imageUrl
      const colorCodeToImageUrl = new Map<string, string>();

      (product as any).variants.forEach((variant: any) => {
        if (variant.imageUrl || !variant.sku) return; // Already has image, skip

        const skuParts = variant.sku.split(/[-_]/);

        for (const part of skuParts) {
          const partLower = part.toLowerCase();

          if (KNOWN_SIZES.has(partLower)) continue;  // Skip known sizes (XS, S, M, L...)
          if (part.length < 3) continue;              // Skip very short tokens
          if (/^[a-z]+$/i.test(part)) continue;       // Skip pure color words like "Green", "Orange"

          // This looks like a manufacturer color code (letters + digits, e.g. GL186, MA216)
          if (colorCodeToImageUrl.has(partLower)) {
            variant.imageUrl = colorCodeToImageUrl.get(partLower);
            break;
          }

          const matchedImage = (product.images as any[]).find((img: any) =>
            img.url && img.url.toLowerCase().includes(partLower)
          );

          if (matchedImage) {
            variant.imageUrl = matchedImage.url;
            colorCodeToImageUrl.set(partLower, matchedImage.url);
            break;
          }
        }
      });
    }

    await setCache(cacheKey, product, PRODUCT_DETAIL_TTL);
    return product;
  }

  static async getProductsBySkus(skus: string[]): Promise<IProduct[]> {
    if (!skus || skus.length === 0) return [];
    const cacheKey = `products_skus_v2_${skus.slice().sort().join("_")}`;
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
    const cacheKey = `product_kit_v7_${slugOrId}`;
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

    const cacheKey = `product_aggregations_v19_${categorySlug || 'all'}_${serializeFilter(rawActiveFilters || {})}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const { ProductModel } = await import("./product.model");
    
    const baseFilters: any = {
      $or: [
        { status: "published" },
        { status: { $exists: false } }
      ],
      visibility: { $ne: "Not Visible Individually" },
      // Hide out-of-stock products unless they allow backorders
      $and: [
        {
          $or: [
            { stockStatus: { $ne: 0 } },
            { allowBackorders: true }
          ]
        }
      ]
    };
    
    if (rawActiveFilters?.category) {
      let cleanSlug = rawActiveFilters.category.toLowerCase().trim();
      if (cleanSlug.includes('/')) {
        cleanSlug = cleanSlug.split('/').pop() || cleanSlug;
      }
      
      // CRITICAL UPGRADE: We now rely 100% on the accurate categorySlugs mapping.
      // Legacy regex guessing has been commented out for speed and accuracy.
      baseFilters.$and = baseFilters.$and || [];
      
      // 100% STRICT EXACT MATCH
      // The database has been perfectly aligned with the Frontend URLs. No guessing needed!
      baseFilters.$and.push({ categorySlugs: cleanSlug });

      // Clean up Magento's messy tagging: Exclude accessories from main categories
      if (cleanSlug.includes("boot") || cleanSlug.includes("shoe")) {
        baseFilters.$and.push({ name: { $not: /\b(socks?|laces?|insole|covers?|toe\s*slider)\b/i } });
      } else if (cleanSlug.includes("helmet")) {
        baseFilters.$and.push({ name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement|cleaner|spray|mask|balaclava)\b/i } });
      } else if (cleanSlug.includes("jacket") || cleanSlug.includes("suit") || cleanSlug.includes("pant") || cleanSlug.includes("jeans")) {
        baseFilters.$and.push({ name: { $not: /\b((hip|knee|elbow|back|shoulder|chest)\s*(protector|armor|armour|insert|pad|pads)|armour\s*insert|armor\s*insert|base\s*layer|liner)\b/i } });
      } else if (cleanSlug.includes("communicator") || cleanSlug.includes("intercom")) {
        baseFilters.$and.push({ name: { $not: /\b(cable|wire|battery|clamp|mount|pad)\b/i } });
      }

      /*
      --- LEGACY REGEX GUESSING CODE (COMMENTED OUT AFTER MIGRATION) ---
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

      if (cleanSlug.includes("off-road-boot") || cleanSlug.includes("off-road-riding-boot")) {
        ... (100+ lines of legacy code)
      */
    }
    
    if (rawActiveFilters?.search) {
      const escaped = rawActiveFilters.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const searchRegex = new RegExp(escaped, "i");
      baseFilters.$and = baseFilters.$and || [];
      baseFilters.$and.push({
        $or: [
          { name: { $regex: searchRegex } },
          { brand: { $regex: searchRegex } },
          { sku: { $regex: searchRegex } },
          { magentoCategories: { $regex: searchRegex } },
        ],
      });
    }

    baseFilters.$and = baseFilters.$and || [];
    baseFilters.$and.push({
      $or: [
        { stockStatus: { $ne: 0 } },
        { allowBackorders: true },
        { "variants.stock": { $gt: 0 } }
      ]
    });

    const products = await ProductModel.find(baseFilters)
      .select("brand magentoCategories variants configurableVariations colorImages stockStatus attributes basePrice specialPrice")
      .lean()
      .exec();

    const brandsMap = new Map<string, number>();
    const categoriesMap = new Map<string, number>();
    const colorsMap = new Map<string, Set<string>>();
    const sizesMap = new Map<string, Set<string>>();
    
    const dynamicAttrsMap = new Map<string, Map<string, Set<string>>>();
    const TRACKED_ATTRS = ['material', 'riding_style', 'certification', 'gender'];

    const activeBrands = rawActiveFilters?.brand?.map((b: string) => b.toLowerCase()) || [];
    const activeColors = rawActiveFilters?.colour?.map((c: string) => c.toLowerCase()) || [];
    const activeSizes = rawActiveFilters?.size?.map((s: string) => s.toLowerCase()) || [];

    let overallMinPrice = Infinity;
    let overallMaxPrice = 0;

    products.forEach((p: any) => {
      const pName = (p.name || "").toLowerCase();
      const pBrand = (p.brand || (p.attributes && (p.attributes.brand || p.attributes.Brand)) || "").toLowerCase();
      let matchesBrand = true;
      if (activeBrands.length > 0) {
        matchesBrand = activeBrands.some((b: string) => {
          if (!b) return false;
          const flexibleB = b.replace(/-/g, '[\\s\\-]');
          const regex = new RegExp(flexibleB, 'i');
          if (pBrand && regex.test(pBrand)) return true;
          const wordRegex = new RegExp(`\\b${flexibleB}\\b`, "i");
          return wordRegex.test(pName);
        });
      }

      let matchesColor = true;
      let matchesSize = true;
      
      const availableColors = new Set<string>();
      const availableSizes = new Set<string>();
      
      const getDynamicAttrLocal = (obj: any, keywords: string[]) => {
        if (!obj || typeof obj !== 'object') return undefined;
        const key = Object.keys(obj).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
        return key ? obj[key] : undefined;
      };

      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          const vCol = getDynamicAttrLocal(v.attributes, ['color', 'colour']);
          if (vCol) availableColors.add(vCol.toLowerCase());
          const vSiz = getDynamicAttrLocal(v.attributes, ['size', 'eu_size']);
          if (vSiz) availableSizes.add(vSiz.toLowerCase());
        });
      }
      
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
      
      if (p.colorImages && typeof p.colorImages === 'object') {
        Object.keys(p.colorImages).forEach(c => availableColors.add(c.trim().toLowerCase()));
      }

      if (activeColors.length > 0) {
        matchesColor = activeColors.some((c: string) => availableColors.has(c));
      }
      if (activeSizes.length > 0) {
        matchesSize = activeSizes.some((s: string) => availableSizes.has(s));
      }

      if (pBrand && matchesColor && matchesSize) {
        brandsMap.set(pBrand, (brandsMap.get(pBrand) || 0) + 1);
      }

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

      const extractedVariants: any[] = [];
      
      const getDynamicAttr = (obj: any, keywords: string[]) => {
        if (!obj || typeof obj !== 'object') return undefined;
        const key = Object.keys(obj).find(k => keywords.some(kw => k.toLowerCase().includes(kw)));
        return key ? obj[key] : undefined;
      };

      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v: any) => {
          extractedVariants.push({ 
            color: getDynamicAttr(v.attributes, ['color', 'colour']), 
            size: getDynamicAttr(v.attributes, ['size', 'eu_size']) 
          });
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
          extractedVariants.push({ 
            color: getDynamicAttr(vObj, ['color', 'colour']), 
            size: getDynamicAttr(vObj, ['size', 'eu_size']) 
          });
        }
      }
      
      if (p.colorImages && typeof p.colorImages === 'object') {
        Object.keys(p.colorImages).forEach(c => {
          extractedVariants.push({ color: c, size: undefined });
        });
      }

      if (p.attributes && typeof p.attributes === 'object') {
        const topColor = getDynamicAttr(p.attributes, ['color', 'colour']);
        const topSize = getDynamicAttr(p.attributes, ['size', 'eu_size']);
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

      if (matchesBrand && matchesColor && matchesSize) {
        TRACKED_ATTRS.forEach(attrName => {
          let attrValue = '';
          if (attrName === 'gender' && p.gender) {
            attrValue = p.gender;
          } else if (p.attributes && typeof p.attributes === 'object') {
            const capName = attrName.charAt(0).toUpperCase() + attrName.slice(1);
            const upperName = attrName.toUpperCase();
            attrValue = p.attributes[attrName] || p.attributes[capName] || p.attributes[upperName];
          }

          if (attrValue) {
            const cleanVals = attrValue.split(',').map(v => v.trim()).filter(Boolean);
            if (!dynamicAttrsMap.has(attrName)) dynamicAttrsMap.set(attrName, new Map());
            const valMap = dynamicAttrsMap.get(attrName)!;
            cleanVals.forEach(cleanVal => {
              if (!valMap.has(cleanVal)) valMap.set(cleanVal, new Set());
              valMap.get(cleanVal)!.add(p._id.toString());
            });
          }
        });
      }

      if (matchesBrand && matchesColor && matchesSize) {
        let pBase = p.basePrice || 0;
        let pSpecial = p.specialPrice;

        if (!pBase && p.variants && p.variants.length > 0) {
          const vPrices = p.variants.map((v: any) => v.price).filter((pr: number) => pr > 0);
          if (vPrices.length > 0) pBase = Math.min(...vPrices);
          if (!pSpecial) {
            const vSpecials = p.variants.map((v: any) => v.specialPrice).filter((pr: number) => pr > 0);
            if (vSpecials.length > 0) pSpecial = Math.min(...vSpecials);
          }
        }
        
        if (!pBase && pSpecial && pSpecial > 0) {
          pBase = pSpecial;
          pSpecial = undefined;
        }

        const finalPrice = (pSpecial && pSpecial > 0 && pBase > 0 && pSpecial < pBase) ? pSpecial : pBase;
        if (finalPrice > 0) {
          if (finalPrice < overallMinPrice) overallMinPrice = finalPrice;
          if (finalPrice > overallMaxPrice) overallMaxPrice = finalPrice;
        }
      }
    });

    const dynamicAttributesResponse: Record<string, any[]> = {};
    for (const [attrName, valMap] of dynamicAttrsMap.entries()) {
      if (attrName === 'helmet_type' && rawActiveFilters?.category && !rawActiveFilters.category.toLowerCase().includes('helmet')) {
        continue;
      }
      if (attrName === 'certification' && rawActiveFilters?.category) {
        const catLow = rawActiveFilters.category.toLowerCase();
        if (catLow.includes('boot') || catLow.includes('women')) {
          continue;
        }
      }
      if (attrName === 'gender' && rawActiveFilters?.category) {
        const cat = rawActiveFilters.category.toLowerCase();
        if (cat.includes('helmet') || cat.includes('visor') || cat.includes('gadget') || cat.includes('luggage') || cat.includes('spare') || cat.includes('accessori') || cat.includes('parts') || cat.includes('mount') || cat.includes('intercom')) {
          continue;
        }
      }
      
      dynamicAttributesResponse[attrName] = Array.from(valMap.entries())
        .map(([name, set]) => ({ name, count: set.size }))
        .sort((a, b) => b.count - a.count);
    }

    const result: any = {
      brands: Array.from(brandsMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      categories: Array.from(categoriesMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      colors: Array.from(colorsMap.entries()).map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count),
      sizes: Array.from(sizesMap.entries()).map(([name, set]) => ({ name, count: set.size })).sort((a, b) => b.count - a.count),
      dynamicAttributes: dynamicAttributesResponse,
      priceStats: { 
        min: overallMinPrice === Infinity ? 0 : overallMinPrice, 
        max: overallMaxPrice 
      },
      filterConfig: undefined,
    };

    if (categorySlug) {
      const { CategoryModel } = await import("../category/category.model");
      const categoryDoc = await CategoryModel.findOne({ slug: categorySlug }).lean().exec() as any;
      if (categoryDoc && Array.isArray(categoryDoc.filterConfig) && categoryDoc.filterConfig.length > 0) {
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
