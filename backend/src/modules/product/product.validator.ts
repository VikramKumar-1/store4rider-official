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
      status: { $nin: ["draft", "archived"] },
      // Magento visibility "1" means "Not Visible Individually", but text exports say "Not Visible Individually"
      visibility: { $nin: ["1", "Not Visible Individually"] }
    };
    const andConditions: any[] = [
      {
        $or: [
          { basePrice: { $gt: 0 } },
          { specialPrice: { $gt: 0 } },
          { "variants.price": { $gt: 0 } }
        ]
      },
      // Hide out-of-stock products unless they allow backorders or have variant stock
      {
        $or: [
          { stockStatus: { $ne: 0 } },
          { allowBackorders: true },
          { "variants.stock": { $gt: 0 } }
        ]
      }
    ];
    
    // Accurate category matching for Magento paths and product names with word boundaries
    if (category) {
      let cleanSlug = category.toLowerCase().trim();
      if (cleanSlug.includes('/')) {
        cleanSlug = cleanSlug.split('/').pop() || cleanSlug;
      }
      
      // STRICT DICTIONARY MAPPING (Frontend URL -> Exact Magento CSV Slug)
      // This ensures 100% accuracy without regex guessing or stripping 's'.
      // 100% STRICT EXACT MATCH
      // The database has been perfectly aligned with the Frontend URLs. No guessing needed!
      andConditions.push({ categorySlugs: cleanSlug });

      // Clean up Magento's messy tagging: Exclude accessories from main categories
      if (cleanSlug.includes("boot") || cleanSlug.includes("shoe")) {
        andConditions.push({ name: { $not: /\b(socks?|laces?|insole|covers?|toe\s*slider)\b/i } });
      } else if (cleanSlug.includes("helmet")) {
        andConditions.push({ name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement|cleaner|spray|mask|balaclava)\b/i } });
      } else if (cleanSlug.includes("jacket") || cleanSlug.includes("suit") || cleanSlug.includes("pant") || cleanSlug.includes("jeans")) {
        andConditions.push({ name: { $not: /\b((hip|knee|elbow|back|shoulder|chest)\s*(protector|armor|armour|insert|pad|pads)|armour\s*insert|armor\s*insert|base\s*layer|liner)\b/i } });
      } else if (cleanSlug.includes("communicator") || cleanSlug.includes("intercom")) {
        andConditions.push({ name: { $not: /\b(cable|wire|battery|clamp|mount|pad)\b/i } });
      }

      /* 
      --- LEGACY REGEX GUESSING CODE (COMMENTED OUT AFTER MIGRATION) ---
      const preEngineLength = andConditions.length;
      
      // We must re-enable the regex engine because Magento data is missing category tags,
      // and we MUST search the product names to find all products!
      if (cleanSlug.includes("modular") || cleanSlug.includes("flip-up")) {
      ...
      (400 lines of legacy code)
      */
    }

    if (brand) {
      const brandsList = brand.split(",").map(b => b.trim()).filter(Boolean);
      const makeBrandCondition = (b: string) => {
        // Replace hyphens with a regex that allows both hyphen and space
        // This ensures frontend slugs like "royal-enfield" match "Royal Enfield" in the DB.
        const flexibleBrand = ProductValidator.escapeRegExp(b).replace(/-/g, '[\\s\\-]');
        
        const regex = b.toLowerCase() === "mt" 
          ? /\bmt\b|mt helmets/i 
          : new RegExp(flexibleBrand, "i");
          
        const wordRegex = b.toLowerCase() === "mt"
          ? /\bmt\b/i
          : new RegExp(`\\b${flexibleBrand}\\b`, "i");
          
        return {
          $or: [
            { brand: regex },
            { "attributes.brand": regex },
            { name: wordRegex }
          ]
        };
      };

      if (brandsList.length === 1) {
        andConditions.push(makeBrandCondition(brandsList[0]));
      } else if (brandsList.length > 1) {
        andConditions.push({ $or: brandsList.map(b => makeBrandCondition(b)) });
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
          { specialPrice: { ...baseCond, $gt: 0 } },
          { basePrice: { ...baseCond, $gt: 0 } },
          { "variants.price": variantCond },
        ],
      });
    }

    const inStock = searchParams.get("inStock");
    if (inStock === "true" || inStock === "1") {
      // Explicitly show only IN STOCK
      andConditions.push({ 
        $or: [
          { stockStatus: { $gt: 0 } },
          { allowBackorders: true },
          { "variants.stock": { $gt: 0 } }
        ]
      });
    } else if (inStock === "false" || inStock === "0" || inStock === "all") {
      // Explicitly requested to see everything, including out of stock (no filter applied)
    } else {
      // DEFAULT: Hide out of stock products
      andConditions.push({ 
        $or: [
          { stockStatus: { $ne: 0 } },
          { allowBackorders: true },
          { "variants.stock": { $gt: 0 } }
        ]
      });
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
      const skuSizeRegexes = sizes.map(s => new RegExp(`[-_]${ProductValidator.escapeRegExp(s)}(?:[-_]|$)`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: configVarRegexes } },
          { "variants.attributes.size": { $in: exactRegexes } },
          { "variants.attributes.eu_size": { $in: exactRegexes } },
          { "attributes.size": { $in: exactRegexes } },
          { "attributes.eu_size": { $in: exactRegexes } },
          { sku: { $in: skuSizeRegexes } }
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
      const nameColorRegexes = colours.map(c => new RegExp(`\\b${ProductValidator.escapeRegExp(c)}\\b`, "i"));
      const skuColorRegexes = colours.map(c => new RegExp(`[-_]${ProductValidator.escapeRegExp(c)}[-_]`, "i"));
      
      // Also check colorImages keys
      const colorImageConditions = colours.flatMap(c => {
        const lower = c.toLowerCase();
        const upper = c.toUpperCase();
        const title = lower.charAt(0).toUpperCase() + lower.slice(1);
        return [
          { [`colorImages.${c}`]: { $exists: true } },
          { [`colorImages.${lower}`]: { $exists: true } },
          { [`colorImages.${upper}`]: { $exists: true } },
          { [`colorImages.${title}`]: { $exists: true } }
        ];
      });
      andConditions.push({
        $or: [
          { configurableVariations: { $in: configVarRegexes } },
          { "variants.attributes.color": { $in: exactRegexes } },
          { "variants.attributes.colour": { $in: exactRegexes } },
          { "attributes.color": { $in: exactRegexes } },
          { "attributes.colour": { $in: exactRegexes } },
          { name: { $in: nameColorRegexes } },
          { sku: { $in: skuColorRegexes } },
          ...colorImageConditions
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
