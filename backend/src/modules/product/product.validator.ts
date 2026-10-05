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
      let cleanSlug = category.toLowerCase().trim();
      
      // TRANSLATOR: Map frontend SEO URLs back to the exact Magento DB slugs
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

      const preEngineLength = andConditions.length;
      
      // We must re-enable the regex engine because Magento data is missing category tags,
      // and we MUST search the product names to find all products!
      if (cleanSlug.includes("modular") || cleanSlug.includes("flip-up")) {
        andConditions.push({
          $or: [
            { magentoCategories: /modular/i },
            { name: /modular/i },
          ],
          name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement)\b/i }
        });
      } else if (cleanSlug.includes("half-face") || cleanSlug.includes("open-face")) {
        andConditions.push({
          $or: [
            { magentoCategories: /half face|open face/i },
            { name: /half face|open face/i },
          ],
          name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement)\b/i }
        });
      } else if (cleanSlug.includes("off-road-boot") || cleanSlug.includes("off-road-riding-boot")) {
        andConditions.push({
          $or: [
            { magentoCategories: /off road.*boot|motocross.*boot|mx.*boot/i },
            { name: /off road.*boot|motocross.*boot|mx.*boot/i }
          ]
        });
      } else if (cleanSlug.includes("off-road") || cleanSlug.includes("motocross")) {
        const baseOr = [
          { magentoCategories: /off road|motocross|mx/i },
          { name: /off road|motocross|mx/i },
        ];
        if (cleanSlug.includes("helmet")) {
          andConditions.push({
            $and: [
              { $or: baseOr },
              { $or: [{ magentoCategories: /helmet/i }, { name: /helmet/i }] },
              { name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement)\b/i } }
            ]
          });
        } else {
          andConditions.push({ $or: baseOr });
        }
      } else if (cleanSlug.includes("full-face")) {
        andConditions.push({
          $or: [
            { magentoCategories: /full.*face/i },
            { name: /full.*face/i },
          ],
          name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement)\b/i }
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
      } else if (cleanSlug.includes("helmet-visor") || cleanSlug.includes("visor")) {
        andConditions.push({
          $or: [{ name: /visor/i }, { magentoCategories: /visor/i }]
        });
      } else if (cleanSlug.includes("balaclava") || cleanSlug.includes("mask") || cleanSlug.includes("bandana")) {
        andConditions.push({
          $or: [{ name: /balaclava|mask|bandana/i }, { magentoCategories: /balaclava|mask|bandana/i }]
        });
      } else if (cleanSlug.includes("bluetooth-intercom") || cleanSlug.includes("intercom")) {
        andConditions.push({
          $or: [{ name: /bluetooth|intercom|sena|parani/i }, { magentoCategories: /bluetooth|intercom/i }]
        });
      } else if (cleanSlug.includes("helmet-cleaner") || cleanSlug.includes("cleaner")) {
        andConditions.push({
          $or: [{ name: /cleaner|spray|muc-off/i }, { magentoCategories: /cleaner/i }]
        });
      } else if (cleanSlug.includes("full-face-helmet")) {
        andConditions.push({
          $or: [{ name: /full.*face/i }, { magentoCategories: /full.*face/i }]
        });
      } else if (cleanSlug.includes("modular-helmet") || cleanSlug.includes("flip-up")) {
        andConditions.push({
          $or: [{ name: /modular|flip.*up/i }, { magentoCategories: /modular|flip.*up/i }]
        });
      } else if (cleanSlug.includes("half-face-helmet") || cleanSlug.includes("open-face")) {
        andConditions.push({
          $or: [{ name: /half.*face|open.*face/i }, { magentoCategories: /half.*face|open.*face/i }]
        });
      } else if (cleanSlug.includes("off-road-helmet") || cleanSlug.includes("motocross-helmet")) {
        andConditions.push({
          $or: [{ name: /off.*road|motocross/i }, { magentoCategories: /off.*road|motocross/i }]
        });
      } else if (cleanSlug.includes("helmet")) {
        const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
        andConditions.push({
          $or: [
            { name: new RegExp(keywords.split(" ").join(".*"), "i") },
            { magentoCategories: new RegExp(keywords, "i") }
          ],
          name: { $not: /\b(visor|visors|pinlock|nose\s*deflector|breath\s*deflector|cheek\s*pad|cheek\s*pads|spoiler|shield\s*mechanism|anti-fog|helmet\s*cleaner|helmet\s*spray|cleaning\s*spray|balaclava|mask|bandana|sleeve|sleeves|combo|chin\s*curtain|ratchet|pivot|screw|lock|vent|vents|replacement)\b/i }
        });
      } else if (cleanSlug.includes("jacket") || cleanSlug.includes("suit")) {
        const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
        andConditions.push({
          $or: [
            { name: new RegExp(keywords.split(" ").join(".*"), "i") },
            { 
              magentoCategories: new RegExp(keywords, "i"),
              name: { $not: /\b(protector|armour|armor|insert|knee|hip|elbow|chest|back\s*armor|base\s*layer|t-shirt|jersey|lower|pants?)\b/i }
            }
          ],
          name: { $not: /\b(hip\s*protector|knee\s*protector|elbow\s*protector|back\s*protector|armour\s*insert|armor\s*insert|back\s*armor|base\s*layer)\b/i }
        });
      } else if (cleanSlug.includes("short-biking-boot")) {
        andConditions.push({
          $or: [{ name: /short.*boot|short.*riding/i }, { magentoCategories: /short.*boot|city/i }]
        });
      } else if (cleanSlug.includes("sports-riding-shoe")) {
        andConditions.push({
          $or: [{ name: /sport.*shoe|riding.*shoe/i }, { magentoCategories: /sport.*shoe|riding.*shoe/i }]
        });
      } else if (cleanSlug.includes("off-road-boot") || cleanSlug.includes("offroad-boot")) {
        andConditions.push({
          $or: [{ name: /off.*road.*boot|motocross/i }, { magentoCategories: /off.*road.*boot/i }]
        });
      } else if (cleanSlug.includes("boot") || cleanSlug.includes("shoe")) {
        const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
        andConditions.push({
          $or: [
            { name: new RegExp(keywords.split(" ").join(".*"), "i") },
            { magentoCategories: new RegExp(keywords, "i") }
          ],
          name: { $not: /\b(toe\s*slider|laces?|insole)\b/i }
        });
      } else if (cleanSlug.includes("full-gauntlet-glove")) {
        andConditions.push({
          $or: [{ name: /full.*gauntlet/i }, { magentoCategories: /full.*gauntlet/i }]
        });
      } else if (cleanSlug.includes("semi-gauntlet-glove")) {
        andConditions.push({
          $or: [{ name: /semi.*gauntlet/i }, { magentoCategories: /semi.*gauntlet/i }]
        });
      } else if (cleanSlug.includes("short-motorbike-glove") || cleanSlug.includes("short-glove")) {
        andConditions.push({
          $or: [{ name: /short.*glove/i }, { magentoCategories: /short.*glove/i }]
        });
      } else if (cleanSlug.includes("winter-glove") || cleanSlug.includes("waterproof-glove")) {
        andConditions.push({
          $or: [{ name: /winter|waterproof|rain/i }, { magentoCategories: /winter|waterproof/i }],
          $and: [{ $or: [{ name: /glove/i }, { magentoCategories: /glove/i }] }]
        });
      } else if (cleanSlug.includes("glove")) {
        const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
        andConditions.push({
          $or: [
            { name: new RegExp(keywords.split(" ").join(".*"), "i") },
            { magentoCategories: new RegExp(keywords, "i") }
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
      } else if (cleanSlug.includes("touring-pant")) {
        andConditions.push({
          $or: [{ name: /touring.*pant/i }, { magentoCategories: /touring.*pant/i }]
        });
      } else if (cleanSlug.includes("riding-jeans")) {
        andConditions.push({
          $or: [{ name: /\bjeans?\b/i }, { magentoCategories: /\bjeans?\b/i }]
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
      } else if (cleanSlug.includes("women-riding-gear") || cleanSlug.includes("women") || cleanSlug.includes("riding-gear-for-women")) {
        andConditions.push({
          $or: [{ name: /\b(women|womens|lady|ladies|female)\b/i }, { magentoCategories: /\b(women|womens|lady|ladies|female)\b/i }, { gender: /women|female|lady/i }]
        });
      } else if (cleanSlug.includes("protectors-armour") || cleanSlug.includes("protector") || cleanSlug.includes("armour")) {
        andConditions.push({
          $or: [{ name: /protector|armour|armor|insert/i }, { magentoCategories: /protector|armour|armor/i }]
        });
      } else if (cleanSlug.includes("knee-guard") || cleanSlug.includes("knee-slider")) {
        andConditions.push({
          $or: [{ name: /knee.*guard|knee.*slider|knee.*brace/i }, { magentoCategories: /knee.*guard|knee.*slider|knee.*brace/i }]
        });
      } else if (cleanSlug.includes("off-road-motocross") || cleanSlug.includes("offroad")) {
        andConditions.push({
          $or: [{ name: /off.*road|motocross|dirt|mx/i }, { magentoCategories: /off.*road|motocross|dirt|mx/i }]
        });
      } else if (cleanSlug.includes("riding-gear")) {
        andConditions.push({
          $or: [
            { magentoCategories: /riding gear/i },
            { name: /\b(jacket|jackets|glove|gloves|boot|boots|pant|pants)\b/i }
          ]
        });
      } else {
        const exactPhrase = cleanSlug.replace(/-/g, " ").trim();
        const keywords = exactPhrase
          .split(/\s+/)
          .filter((w) => !["motorcycle", "riding", "bike", "for", "online"].includes(w) && w.length > 1);
          
        if (keywords.length > 0) {
          // Build a lookahead regex that REQUIRES all keywords to be present in any order
          const lookaheads = keywords.map(w => `(?=.*\\b${w})`).join("");
          const andPattern = `^${lookaheads}.*$`;
          
          andConditions.push({
            $or: [
              { magentoCategories: new RegExp(exactPhrase, "i") },
              { magentoCategories: new RegExp(andPattern, "i") },
              { name: new RegExp(andPattern, "i") }
            ]
          });
        } else {
          andConditions.push({
            $or: [
              { magentoCategories: new RegExp(exactPhrase, "i") },
              { name: new RegExp(exactPhrase, "i") }
            ]
          });
        }
      }

      // -------------------------------------------------------------
      // WRAP THE REGEX OUTPUT WITH EXACT DATABASE "CATEGORY SLUGS"
      // If the Regex Engine matches, OR the Database explicitly says so, include it!
      // -------------------------------------------------------------
      if (andConditions.length > preEngineLength) {
        const regexRule = andConditions.pop();
        andConditions.push({
          $or: [
            regexRule,
            { categorySlugs: cleanSlug }
          ]
        });
      }
    }

    if (brand) {
      const brandsList = brand.split(",").map(b => b.trim()).filter(Boolean);
      if (brandsList.length === 1) {
        const b = brandsList[0];
        // FIX: Use exact match (^...$) to prevent partial brand name collisions.
        // Previously used contains-match which meant "LS2" could match "XLS2" etc.
        // This now aligns with how aggregation counts brands (exact equality).
        const regex = b.toLowerCase() === "mt" 
          ? /\bmt\b|mt helmets/i 
          : new RegExp(`^${ProductValidator.escapeRegExp(b)}$`, "i");
        andConditions.push({ brand: { $regex: regex } });
      } else if (brandsList.length > 1) {
        const brandRegexes = brandsList.map(b => {
          const regex = b.toLowerCase() === "mt" 
            ? /\bmt\b|mt helmets/i 
            : new RegExp(`^${ProductValidator.escapeRegExp(b)}$`, "i");
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
          { "variants.attributes.eu_size": { $in: exactRegexes } },
          { "attributes.size": { $in: exactRegexes } },
          { "attributes.eu_size": { $in: exactRegexes } }
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
      // FIX: Also check colorImages keys. Since MongoDB Map keys are case-sensitive,
      // we check the exact, lowercase, UPPERCASE, and TitleCase variations.
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
