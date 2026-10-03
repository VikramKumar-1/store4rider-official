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
    
    const filters: Record<string, unknown> = {
      // Hide child variants (draft) and disabled products (archived)
      // Products with status=published OR status=undefined (old data) will show
      status: { $nin: ["draft", "archived"] }
    };
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
      } else if (cleanSlug.includes("half-face") || cleanSlug.includes("open-face")) {
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
      } else if (cleanSlug.includes("full-face")) {
        andConditions.push({
          $or: [
            { magentoCategories: /full face/i },
            { name: /full face/i },
          ],
          name: { $not: /\b(visor|pinlock|spoiler|deflector|pad|screw|lock)\b/i }
        });
      } else if (cleanSlug.includes("visor") || cleanSlug.includes("pinlock")) {
        andConditions.push({
          $or: [
            { magentoCategories: /visor|pinlock/i },
            { name: /visor|pinlock/i },
          ]
        });
      } else if (cleanSlug.includes("balaclava")) {
        andConditions.push({
          $or: [
            { magentoCategories: /balaclava|face mask/i },
            { name: /balaclava|face mask|head mask/i },
          ]
        });
      } else if (cleanSlug.includes("intercom") || cleanSlug.includes("bluetooth")) {
        andConditions.push({
          $or: [
            { magentoCategories: /intercom|bluetooth|communication/i },
            { name: /intercom|bluetooth|sena|cardo|parani/i },
          ]
        });
      } else if (cleanSlug.includes("cleaner") || cleanSlug.includes("spray") || cleanSlug.includes("care")) {
        andConditions.push({
          $or: [
            { magentoCategories: /cleaner|spray|care|maintenance/i },
            { name: /cleaner|cleaning|spray|wash|polish|lube/i },
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
      } else if (cleanSlug.includes("tank-bag")) {
        andConditions.push({
          $or: [{ magentoCategories: /tank bag/i }, { name: /tank bag/i }]
        });
      } else if (cleanSlug.includes("saddle-bag") || cleanSlug.includes("pannier")) {
        andConditions.push({
          $or: [{ magentoCategories: /saddle bag|saddlebag|pannier/i }, { name: /saddle bag|saddlebag|pannier/i }]
        });
      } else if (cleanSlug.includes("tail-bag")) {
        andConditions.push({
          $or: [{ magentoCategories: /tail bag|tailbag/i }, { name: /tail bag|tailbag/i }]
        });
      } else if (cleanSlug.includes("top-box") || cleanSlug.includes("top-case")) {
        andConditions.push({
          $or: [{ magentoCategories: /top box|top case/i }, { name: /top box|top case/i }]
        });
      } else if (cleanSlug.includes("hydration")) {
        andConditions.push({
          $or: [{ magentoCategories: /hydration|water/i }, { name: /hydration|camelbak/i }]
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
      } else if (cleanSlug.includes("auxiliary-light-filter")) {
        andConditions.push({
          $or: [{ magentoCategories: /filter|cover/i }, { name: /filter|cover/i }],
          $and: [{ $or: [{ magentoCategories: /auxiliary|light/i }, { name: /auxiliary|light/i }] }]
        });
      } else if (cleanSlug.includes("auxiliary-light")) {
        andConditions.push({
          $or: [{ magentoCategories: /auxiliary light|fog light|driving light/i }, { name: /auxiliary light|fog light|driving light/i }]
        });
      } else if (cleanSlug.includes("clamps-mount") || cleanSlug.includes("mounts")) {
        andConditions.push({
          $or: [{ magentoCategories: /clamp|mount|bracket/i }, { name: /clamp|mount|bracket/i }]
        });
      } else if (cleanSlug.includes("wiring-harness") || cleanSlug.includes("switch")) {
        andConditions.push({
          $or: [{ magentoCategories: /wiring|harness|switch|relay/i }, { name: /wiring|harness|switch|relay/i }]
        });
      } else if (cleanSlug.includes("off-beat")) {
        andConditions.push({
          $or: [{ magentoCategories: /off-beat|off beat/i }, { name: /off-beat|off beat/i }]
        });
      } else if (cleanSlug.includes("performance-parts") || cleanSlug.includes("performance")) {
        andConditions.push({
          $or: [{ magentoCategories: /performance/i }, { name: /performance|exhaust|air filter/i }]
        });
      } else if (cleanSlug.includes("rally-tower") || cleanSlug.includes("navigation-tower")) {
        andConditions.push({
          $or: [{ magentoCategories: /rally tower|navigation tower|nav tower/i }, { name: /rally tower|navigation tower|nav tower/i }]
        });
      } else if (cleanSlug.includes("bike-cover")) {
        andConditions.push({
          $or: [{ magentoCategories: /bike cover|motorcycle cover/i }, { name: /bike cover|motorcycle cover/i }]
        });
      } else if (cleanSlug.includes("chain-care") || cleanSlug.includes("chain-lube")) {
        andConditions.push({
          $or: [{ magentoCategories: /chain care|chain lube|chain cleaner/i }, { name: /chain care|chain lube|chain cleaner|chain brush/i }]
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
          { basePrice: { ...baseCond, $gt: 0 } },
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
      // Match "size=X" or "eu_size=X" inside configurableVariations
      const configVarRegexes = sizes.map(s => new RegExp(`(?:size|eu_size)=${ProductValidator.escapeRegExp(s)}(\\||,|$)`, "i"));
      const exactRegexes = sizes.map(s => new RegExp(`^${ProductValidator.escapeRegExp(s)}$`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: configVarRegexes } },
          { "variants.attributes.size": { $in: exactRegexes } },
          { "variants.attributes.eu_size": { $in: exactRegexes } }
        ],
      });
    }

    const colour = searchParams.get("colour") || searchParams.get("color");
    if (colour) {
      const colours = colour.split(',').map(c => c.trim()).filter(Boolean);
      // Match "color=X" inside configurableVariations string precisely
      const configVarRegexes = colours.map(c => new RegExp(`color=${ProductValidator.escapeRegExp(c)}(\\||,|$)`, "i"));
      // Match exact value in structured variants.attributes
      const exactRegexes = colours.map(c => new RegExp(`^${ProductValidator.escapeRegExp(c)}$`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: configVarRegexes } },
          { "variants.attributes.color": { $in: exactRegexes } },
          { "variants.attributes.colour": { $in: exactRegexes } }
        ],
      });
    }

    // Dynamic attribute filters (helmet_type, material, riding_style, certification, gender)
    const DYNAMIC_FILTER_PARAMS = ['helmet_type', 'material', 'riding_style', 'certification', 'gender'];

    for (const paramName of DYNAMIC_FILTER_PARAMS) {
      const paramValue = searchParams.get(paramName);
      if (paramValue) {
        const values = paramValue.split(',').map(v => v.trim()).filter(Boolean);
        if (values.length === 1) {
          andConditions.push({
            $or: [
              { [`attributes.${paramName}`]: new RegExp(`\\b${ProductValidator.escapeRegExp(values[0])}\\b`, 'i') },
              // Also check top-level field for gender (legacy)
              ...(paramName === 'gender' ? [{ gender: new RegExp(`\\b${ProductValidator.escapeRegExp(values[0])}\\b`, 'i') }] : []),
            ]
          });
        } else if (values.length > 1) {
          const orConditions = values.map(v => ({
            $or: [
              { [`attributes.${paramName}`]: new RegExp(`\\b${ProductValidator.escapeRegExp(v)}\\b`, 'i') },
              ...(paramName === 'gender' ? [{ gender: new RegExp(`\\b${ProductValidator.escapeRegExp(v)}\\b`, 'i') }] : []),
            ]
          }));
          andConditions.push({ $or: orConditions.map(c => c.$or).flat() });
        }
      }
    }

    if (search) {
      // Convert hyphens/underscores to spaces and split into individual words
      const searchTerms = search.trim().replace(/[-_]/g, " ").split(/\s+/).filter(Boolean);
      
      if (searchTerms.length > 0) {
        const searchConditions = searchTerms.map(term => {
          const searchRegex = new RegExp(ProductValidator.escapeRegExp(term), "i");
          return {
            $or: [
              { name: { $regex: searchRegex } },
              { brand: { $regex: searchRegex } },
              { sku: { $regex: searchRegex } },
              { magentoCategories: { $regex: searchRegex } },
            ],
          };
        });
        
        // $and ensures ALL typed words must be present somewhere in the document
        andConditions.push({ $and: searchConditions });
      }
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

    return { filters, page, limit, sort, category };
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
