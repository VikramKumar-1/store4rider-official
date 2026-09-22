import { NextRequest } from "next/server";
import { createProductSchema, updateProductSchema } from "@store4riders/shared-validation";

/**
 * ProductValidator
 * 
 * Handles extracting and validating payload data and query parameters 
 * for Product related operations.
 */
export class ProductValidator {
  
  /**
   * Escapes special characters in a string so it can be safely used in a RegExp.
   */
  private static escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  /**
   * Validates the query parameters for listing products.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {{ filters: Record<string, unknown>, page: number, limit: number }}
   */
  static validateListQuery(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search") || searchParams.get("q");
    
    const filters: Record<string, unknown> = {};
    const andConditions: any[] = [];
    
    // Accurate category matching for Magento paths and product names with word boundaries
    if (category) {
      const cleanSlug = category.toLowerCase().trim();

      if (cleanSlug.includes("modular-helmet") || cleanSlug.includes("modular")) {
        andConditions.push({
          $or: [
            { magentoCategories: /modular/i },
            { name: /modular/i },
          ],
          name: { $not: /\b(visor|pinlock|spoiler|deflector|pad|screw|lock)\b/i }
        });
      } else if (cleanSlug.includes("half-face")) {
        andConditions.push({
          $or: [
            { magentoCategories: /half face|open face/i },
            { name: /half face|open face/i },
          ],
          name: { $not: /\b(visor|pinlock|spoiler|deflector|pad|screw|lock)\b/i }
        });
      } else if (cleanSlug.includes("off-road") || cleanSlug.includes("motocross")) {
        andConditions.push({
          $or: [
            { magentoCategories: /off road|motocross|mx/i },
            { name: /off road|motocross|mx/i },
          ]
        });
      } else if (cleanSlug.includes("helmet")) {
        andConditions.push({
          $or: [
            { name: /\bhelmets?\b/i },
            { magentoCategories: /\bhelmets?\b/i }
          ],
          name: { $not: /\b(visor|visors|pinlock|nose\s*deflector|breath\s*deflector|cheek\s*pad|cheek\s*pads|spoiler|shield\s*mechanism|anti-fog|helmet\s*cleaner|helmet\s*spray|cleaning\s*spray)\b/i }
        });
      } else if (cleanSlug.includes("jacket") || cleanSlug.includes("suit")) {
        andConditions.push({
          $or: [
            { name: /\b(jackets?|suits?|vests?)\b/i },
            { 
              magentoCategories: /\b(jackets?|suits?)\b/i,
              name: { $not: /\b(protector|armour|armor|insert|knee|hip|elbow|chest|back\s*armor|base\s*layer|t-shirt|jersey|lower|pants?)\b/i }
            }
          ],
          name: { $not: /\b(hip\s*protector|knee\s*protector|elbow\s*protector|back\s*protector|armour\s*insert|armor\s*insert|back\s*armor|base\s*layer)\b/i }
        });
      } else if (cleanSlug.includes("boot") || cleanSlug.includes("shoe")) {
        andConditions.push({
          $or: [
            { name: /\b(boots?|shoes?|footwear|sneakers?)\b/i },
            { magentoCategories: /\b(boots?|shoes?|footwear)\b/i }
          ],
          name: { $not: /\b(toe\s*slider|laces?|insole)\b/i }
        });
      } else if (cleanSlug.includes("glove")) {
        andConditions.push({
          $or: [
            { name: /\bgloves?\b/i },
            { magentoCategories: /\bgloves?\b/i }
          ]
        });
      } else if (cleanSlug.includes("luggage") || cleanSlug.includes("bag")) {
        andConditions.push({
          $or: [
            { name: /\b(luggage|bags?|backpacks?|panniers?|tail\s*bag|tank\s*bag|saddle\s*bag|top\s*box)\b/i },
            { magentoCategories: /\b(luggage|bags?|backpacks?|panniers?|tail\s*bag|tank\s*bag|saddle)\b/i }
          ]
        });
      } else if (cleanSlug.includes("pant") || cleanSlug.includes("trouser")) {
        andConditions.push({
          $or: [
            { name: /\b(pants?|trousers?|jeans)\b/i },
            { magentoCategories: /\b(pants?|trousers?)\b/i }
          ],
          name: { $not: /\b(knee\s*guard|hip\s*protector|knee\s*protector|armour|armor|insert|knee\s*slider)\b/i }
        });
      } else if (cleanSlug.includes("accessori")) {
        andConditions.push({
          $or: [
            { magentoCategories: /\baccessor(y|ies)|protector|armour|armor\b/i },
            { name: /\b(accessor(y|ies)|cleaner|cover|lock|mount|visor|pinlock|deflector|protector|armour|armor|insert)\b/i }
          ]
        });
      } else if (cleanSlug.includes("riding-gear")) {
        andConditions.push({
          $or: [
            { magentoCategories: /riding gear/i },
            { name: /\b(jacket|jackets|glove|gloves|boot|boots|pant|pants)\b/i }
          ]
        });
      } else {
        const keywords = cleanSlug
          .replace(/-/g, " ")
          .split(/\s+/)
          .filter((w) => !["motorcycle", "riding", "bike", "for"].includes(w));
        const pattern = keywords.length > 0 
          ? `\\b(${keywords.join("|")})\\b` 
          : `\\b${cleanSlug}\\b`;
        andConditions.push({
          $or: [
            { magentoCategories: { $regex: new RegExp(pattern, "i") } },
            { name: { $regex: new RegExp(pattern, "i") } }
          ]
        });
      }
    }

    if (brand) {
      const brandsList = brand.split(",").map(b => b.trim()).filter(Boolean);
      if (brandsList.length === 1) {
        const b = brandsList[0];
        const regex = b.toLowerCase() === "mt" 
          ? /\bmt\b|mt helmets/i 
          : new RegExp(ProductValidator.escapeRegExp(b), "i");
        andConditions.push({ brand: { $regex: regex } });
      } else if (brandsList.length > 1) {
        const brandRegexes = brandsList.map(b => {
          const regex = b.toLowerCase() === "mt" 
            ? /\bmt\b|mt helmets/i 
            : new RegExp(ProductValidator.escapeRegExp(b), "i");
          return { brand: { $regex: regex } };
        });
        andConditions.push({ $or: brandRegexes });
      }
    }

    const minPrice = searchParams.get("minPrice") || searchParams.get("priceMin");
    const maxPrice = searchParams.get("maxPrice") || searchParams.get("priceMax");
    if (minPrice || maxPrice) {
      const baseCond: Record<string, number> = {};
      const variantCond: Record<string, number> = {};
      if (minPrice) {
        baseCond.$gte = parseFloat(minPrice);
        variantCond.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        baseCond.$lte = parseFloat(maxPrice);
        variantCond.$lte = parseFloat(maxPrice);
      }
      andConditions.push({
        $or: [
          { basePrice: baseCond },
          { "variants.price": variantCond },
        ],
      });
    }

    const inStock = searchParams.get("inStock");
    if (inStock === "true" || inStock === "1") {
      andConditions.push({ stockStatus: { $gt: 0 } });
    }

    const onSale = searchParams.get("onSale");
    if (onSale === "true" || onSale === "1") {
      andConditions.push({ specialPrice: { $gt: 0 } });
    }

    const size = searchParams.get("size");
    if (size) {
      const sizes = size.split(',').map(s => s.trim()).filter(Boolean);
      const sizeRegexes = sizes.map(s => new RegExp(`\\b${ProductValidator.escapeRegExp(s)}\\b`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: sizeRegexes } },
          { "variants.sku": { $in: sizeRegexes } },
          { name: { $in: sizeRegexes } },
          { "variants.attributes.size": { $in: sizes.map(s => new RegExp(`^${ProductValidator.escapeRegExp(s)}$`, "i")) } }
        ],
      });
    }

    const colour = searchParams.get("colour") || searchParams.get("color");
    if (colour) {
      const colours = colour.split(',').map(c => c.trim()).filter(Boolean);
      const colourRegexes = colours.map(c => new RegExp(`\\b${ProductValidator.escapeRegExp(c)}\\b`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: colourRegexes } },
          { "variants.sku": { $in: colourRegexes } },
          { name: { $in: colourRegexes } },
          { "variants.attributes.color": { $in: colours.map(c => new RegExp(`^${ProductValidator.escapeRegExp(c)}$`, "i")) } },
          { "variants.attributes.colour": { $in: colours.map(c => new RegExp(`^${ProductValidator.escapeRegExp(c)}$`, "i")) } }
        ],
      });
    }

    if (search) {
      const searchRegex = new RegExp(ProductValidator.escapeRegExp(search.trim()), "i");
      andConditions.push({
        $or: [
          { name: { $regex: searchRegex } },
          { brand: { $regex: searchRegex } },
          { sku: { $regex: searchRegex } },
          { magentoCategories: { $regex: searchRegex } },
        ],
      });
    }

    if (andConditions.length === 1) {
      Object.assign(filters, andConditions[0]);
    } else if (andConditions.length > 1) {
      filters.$and = andConditions;
    }

    const sortParam = searchParams.get("sort");
    let sort: Record<string, 1 | -1> = { createdAt: -1, _id: -1 };
    if (sortParam === "price-asc" || sortParam === "price_asc") {
      sort = { basePrice: 1, _id: -1 };
    } else if (sortParam === "price-desc" || sortParam === "price_desc") {
      sort = { basePrice: -1, _id: -1 };
    } else if (sortParam === "newest") {
      sort = { createdAt: -1, _id: -1 };
    } else if (sortParam === "bestselling" || sortParam === "bestseller") {
      sort = { salesCount: -1, _id: -1 };
    } else if (sortParam === "rating") {
      sort = { avgRating: -1, _id: -1 };
    }

    return { filters, page, limit, sort };
  }

  /**
   * Validates the payload for creating a new product.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<any>} The parsed and validated product data.
   */
  static async validateCreate(req: NextRequest) {
    const body = await req.json();
    return createProductSchema.parse(body);
  }

  /**
   * Validates the payload for updating an existing product.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<any>} The parsed and validated product data.
   */
  static async validateUpdate(req: NextRequest) {
    const body = await req.json();
    return updateProductSchema.parse(body);
  }
}
