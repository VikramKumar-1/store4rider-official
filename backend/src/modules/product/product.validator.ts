import { NextRequest } from "next/server";
import { createProductSchema, updateProductSchema } from "@store4riders/shared-validation";
import { resolveFuzzySearchTerms, getGearAccessoryExclusion } from "../../core/utils/fuzzySearch";
import { buildSearchSlugs } from "./product.category-constants";

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
    const categoryId = searchParams.get("categoryId");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search") || searchParams.get("q");
    
    const scope = searchParams.get("scope");
    const isAdmin = scope === "admin";
    
    const filters: Record<string, unknown> = {};
    const andConditions: any[] = [];

    if (!isAdmin) {
      // Hide child variants (draft) and disabled products (archived)
      // Products with status=published OR status=undefined (old data) will show
      filters.status = { $nin: ["draft", "archived"] };
      // Magento visibility "1" means "Not Visible Individually", but text exports say "Not Visible Individually"
      filters.visibility = { $nin: ["1", "Not Visible Individually"] };

      andConditions.push({
        $or: [
          { basePrice: { $gt: 0 } },
          { specialPrice: { $gt: 0 } },
          { "variants.price": { $gt: 0 } }
        ]
      });

      // Hide out-of-stock products completely on storefront:
      // Strictly allow only products that have active stock or allowBackorders: true
      andConditions.push({
        $or: [
          { allowBackorders: true },
          { "variants.stock": { $gt: 0 } },
          {
            $and: [
              { "variants.0": { $exists: false } },
              { stockStatus: { $ne: 0 } },
              { qty: { $gt: 0 } }
            ]
          }
        ]
      });
    } else {
      // Admin-specific status filter (All, Enabled/Published, Disabled/Draft, Archived)
      const statusParam = searchParams.get("status");
      if (statusParam && statusParam !== "all") {
        const s = statusParam.toLowerCase();
        if (s === "enabled" || s === "published") {
          andConditions.push({
            $or: [
              { status: "published" },
              { status: { $exists: false }, stockStatus: { $ne: 0 } }
            ]
          });
        } else if (s === "disabled" || s === "draft") {
          andConditions.push({
            $or: [
              { status: { $in: ["draft", "archived"] } },
              { stockStatus: 0 }
            ]
          });
        } else if (s === "archived") {
          andConditions.push({ status: "archived" });
        }
      }

      // Admin-specific product type filter (Simple, Configurable)
      const typeParam = searchParams.get("type") || searchParams.get("productType");
      if (typeParam && typeParam !== "all") {
        const tp = typeParam.toLowerCase();
        if (tp.includes("simple")) {
          andConditions.push({ productType: "simple" });
        } else if (tp.includes("configurable")) {
          andConditions.push({ productType: "configurable" });
        } else {
          andConditions.push({ productType: typeParam });
        }
      }

      // Admin-specific attribute set filter
      const attributeSetParam = searchParams.get("attributeSet") || searchParams.get("attributeSetCode");
      if (attributeSetParam && attributeSetParam !== "all") {
        andConditions.push({
          $or: [
            { attributeSetCode: new RegExp('^' + ProductValidator.escapeRegExp(attributeSetParam) + '$', "i") },
            { "attributes.attribute_set_code": new RegExp('^' + ProductValidator.escapeRegExp(attributeSetParam) + '$', "i") }
          ]
        });
      }

      // Admin SKU search / filter
      const skuParam = searchParams.get("sku");
      if (skuParam) {
        andConditions.push({
          $or: [
            { sku: new RegExp(ProductValidator.escapeRegExp(skuParam.trim()), "i") },
            { "variants.sku": new RegExp(ProductValidator.escapeRegExp(skuParam.trim()), "i") }
          ]
        });
      }

      // Admin Name search / filter
      const nameParam = searchParams.get("name");
      const parentOnlyParam = searchParams.get("parentOnly");
      if (parentOnlyParam === "true") {
        andConditions.push({ visibility: { $nin: ["1", "Not Visible Individually"] } });
      }
      if (nameParam) {
        andConditions.push({
          name: new RegExp(ProductValidator.escapeRegExp(nameParam.trim()), "i")
        });
      }

      // Admin ID filter
      const idParam = searchParams.get("id");
      if (idParam) {
        if (idParam.match(/^[0-9a-fA-F]{24}$/)) {
          andConditions.push({ _id: idParam });
        } else {
          andConditions.push({
            $or: [
              { sku: new RegExp(ProductValidator.escapeRegExp(idParam), "i") },
              { "attributes.entity_id": idParam },
              { "attributes.id": idParam }
            ]
          });
        }
      }
    }
    
    if (categoryId) {
      andConditions.push({ categoryId: categoryId.trim() });
    }

    // Accurate category matching for Magento paths and product names with word boundaries
    if (category) {
      let cleanSlug = category.toLowerCase().trim();
      if (cleanSlug.includes('/')) {
        cleanSlug = cleanSlug.split('/').pop() || cleanSlug;
      }
      
      // Smart category matcher:
      // Smart category matcher using shared alias constants (product.category-constants.ts)
      const searchSlugs = buildSearchSlugs(cleanSlug);

      // Match ANY of the possible variations in the DB (Category Match)
      // Match ANY of the possible variations in the DB (Category Match - slugs or direct categoryId)
      const isHexId = /^[0-9a-fA-F]{24}$/.test(category.trim());
      const categoryMatchCondition: any = isHexId
        ? { categoryId: category.trim() }
        : { categorySlugs: { $in: searchSlugs } };

      // Clean up Magento's messy tagging: Exclude accessories from main categories
      const excludeConditions: any[] = [];
      if (!isAdmin) {
      if ((cleanSlug.includes("boot") || cleanSlug.includes("shoe")) && !cleanSlug.includes("sock") && !cleanSlug.includes("lace") && !cleanSlug.includes("insole") && !cleanSlug.includes("cover") && !cleanSlug.includes("slider")) {
        excludeConditions.push({ name: { $not: /\b(socks?|laces?|insole|covers?|toe\s*slider)\b/i } });
      } else if (cleanSlug.includes("helmet") && !cleanSlug.includes("visor") && !cleanSlug.includes("cleaner") && !cleanSlug.includes("balaclava") && !cleanSlug.includes("intercom") && !cleanSlug.includes("communicator") && !cleanSlug.includes("spoiler") && !cleanSlug.includes("pinlock") && !cleanSlug.includes("lens") && !cleanSlug.includes("shield")) {
        excludeConditions.push({ name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement|cleaner|spray|mask|balaclava|lens|shield|glove|gloves|jacket|jackets|boots?|shoes?|pants?|backpacks?|bags?|luggage|hydration|tail\s*bag|tank\s*bag|saddle\s*bag|panniers?)\b/i } });
      } else if ((cleanSlug.includes("jacket") || cleanSlug.includes("suit") || cleanSlug.includes("pant") || cleanSlug.includes("jeans")) && !cleanSlug.includes("armor") && !cleanSlug.includes("armour") && !cleanSlug.includes("protector") && !cleanSlug.includes("guard") && !cleanSlug.includes("pad") && !cleanSlug.includes("insert") && !cleanSlug.includes("layer") && !cleanSlug.includes("liner")) {
        excludeConditions.push({ name: { $not: /\b((hip|knee|elbow|back|shoulder|chest)\s*(protector|armor|armour|insert|pad|pads)|armour\s*insert|armor\s*insert|base\s*layer|liner)\b/i } });
      } else if ((cleanSlug.includes("communicator") || cleanSlug.includes("intercom")) && !cleanSlug.includes("mount") && !cleanSlug.includes("cable") && !cleanSlug.includes("wire") && !cleanSlug.includes("battery") && !cleanSlug.includes("clamp") && !cleanSlug.includes("pad")) {
        excludeConditions.push({ name: { $not: /\b(cable|wire|battery|clamp|mount|pad)\b/i } });
      } else if (cleanSlug.includes("knee-guard") || cleanSlug.includes("knee-guards")) {
        excludeConditions.push({ name: { $not: /\b(hip|elbow|shoulder|back|chest|tailbone)\b/i } });
      }
      }

      /* 
      --- POWERFUL REGEX ENGINE FALLBACK ---
      If Magento data is missing category tags (which happens often!),
      we search the product names directly to make sure we don't miss ANY products.
      */
      
      const regexConditions: any[] = [];
      const c = cleanSlug;
      
      // HELMETS
      if (c.includes("modular") || c.includes("flip-up")) regexConditions.push({ name: /\b(modular|flip\s*up)\b/i });
      else if ((c.includes("off-road") || c.includes("motocross")) && c.includes("helmet")) regexConditions.push({ name: /\b(off\s*road|motocross|mx|dirt|x-cross)\b.*\b(helmet|helmets)\b|\b(helmet|helmets)\b.*\b(off\s*road|motocross|mx|dirt|x-cross)\b/i });
      else if (c.includes("full-face")) regexConditions.push({ name: /\b(full\s*face)\b/i });
      else if (c.includes("open-face") || c.includes("half-face")) regexConditions.push({ name: /\b(open\s*face|half\s*face|jet\s*helmet|retro\s*jet)\b/i });
      else if (c.includes("dual-sport") || c.includes("adv")) regexConditions.push({ name: /\b(dual\s*sport|adv|adventure\s*helmet)\b/i });
      
      // HELMET ACCESSORIES
      else if (c.includes("visor") || c.includes("helmet-accessories") || c.includes("pinlock")) regexConditions.push({ name: /\b(visor|pinlock|shield|lens|spoiler|peak)\b/i });
      else if (c.includes("spoiler")) regexConditions.push({ name: /\b(spoiler)\b/i });
      else if (c.includes("communicator") || c.includes("intercom")) regexConditions.push({ name: /\b(intercom|bluetooth|communicator|sena|cardo|parani|bluarmor)\b/i });
      
      // LUGGAGE
      else if (c.includes("tail-bag")) regexConditions.push({ name: /\b(tail\s*bag|tailbag|rear\s*bag)\b/i });
      else if (c.includes("saddle-bag") || c.includes("pannier")) regexConditions.push({ name: /\b(saddle\s*bag|saddlebag|pannier|side\s*box)\b/i });
      else if (c.includes("tank-bag")) regexConditions.push({ name: /\b(tank\s*bag|tankbag)\b/i });
      else if (c.includes("backpack")) regexConditions.push({ name: /\b(backpack|rucksack)\b/i });
      
      // RIDING GEAR
      else if (c.includes("riding-shirt")) regexConditions.push({ name: /\b(riding\s*shirt)\b/i });
      else if (c.includes("mesh-jacket")) regexConditions.push({ name: /\b(mesh.*jacket|jacket.*mesh)\b/i });
      else if (c.includes("textile-jacket")) regexConditions.push({ name: /\b(textile.*jacket|jacket.*textile)\b/i });
      else if (c.includes("leather-jacket")) regexConditions.push({ name: /\b(leather.*jacket|jacket.*leather)\b/i });
      else if (c.includes("jacket")) regexConditions.push({ name: /\b(jacket|jackets)\b/i });
      
      else if (c.includes("riding-jean") || c.includes("kevlar")) regexConditions.push({ name: /\b(jeans|denim|kevlar)\b/i });
      else if (c.includes("textile-pant")) regexConditions.push({ name: /\b(textile.*pant|pant.*textile)\b/i });
      else if (c.includes("leather-pant")) regexConditions.push({ name: /\b(leather.*pant|pant.*leather)\b/i });
      else if (c.includes("pant") || c.includes("trouser")) regexConditions.push({ name: /\b(pant|pants|trousers|jeans)\b/i });
      
      else if (c.includes("short-glove")) regexConditions.push({ name: /\b(short.*glove|glove.*short)\b/i });
      else if (c.includes("gauntlet") || c.includes("full-glove")) regexConditions.push({ name: /\b(gauntlet|full.*glove|glove.*full)\b/i });
      else if (c.includes("glove")) regexConditions.push({ name: /\b(glove|gloves)\b/i });
      
      else if (c.includes("racing") || c.includes("sport")) regexConditions.push({ name: /\b(racing|sport|track)\b.*\b(boot|shoe|boots|shoes)\b/i });
      else if (c.includes("off-road") || c.includes("adventure") || c.includes("adv")) regexConditions.push({ name: /\b(adv.*boot|adventure.*boot|off.*road.*boot|motocross.*boot)\b/i });
      else if (c.includes("short-biking") || c.includes("short-boot")) regexConditions.push({ name: /\b(short.*boot|boot.*short|sneaker|riding\s*shoe)\b/i });
      else if (c.includes("riding-sneaker")) regexConditions.push({ name: /\b(sneaker|riding\s*shoe)\b/i });
      else if (c.includes("shoe") || c.includes("boot")) regexConditions.push({ name: /\b(shoe|shoes|boot|boots)\b/i });
      
      // PROTECTION & OTHERS
      else if (c.includes("knee-guard")) regexConditions.push({ name: /\b(knee.*guard|bionic.*knee)\b/i });
      else if (c.includes("back-protector")) regexConditions.push({ name: /\b(back.*protector|back.*insert)\b/i });
      else if (c.includes("protector") || c.includes("guard")) regexConditions.push({ name: /\b(protector|guard|bionic|armor)\b/i });
      else if (c.includes("balaclava")) regexConditions.push({ name: /\b(balaclava|mask)\b/i });
      else if (c.includes("chain-care") || c.includes("chain-lube")) {
        regexConditions.push({ name: /\b(chain\s*(lube|clean|cleaner|spray|paste|brush|wax)|(lube|clean|cleaner|spray|paste|wax)\s*chain)\b/i });
        excludeConditions.push({ name: { $not: /\b(sprocket|sprockets|chain\s*kit|sprocket\s*kit)\b/i } });
      }
      else if (c.includes("chain-sprocket") || c.includes("sprocket")) {
        regexConditions.push({ name: /\b(sprocket|sprockets|chain\s*sprocket|sprocket\s*kit)\b/i });
        excludeConditions.push({ name: { $not: /\b(lube|cleaner|spray|paste|brush)\b/i } });
      }
      else if (c.includes("cleaner")) regexConditions.push({ name: /\b(cleaner|cleaning|spray|wash)\b/i });
      else if (c.includes("touring-pant")) regexConditions.push({ name: /\b(touring.*pant|pant.*touring)\b/i });
      else if (c.includes("touring-gear") || c === "touring") regexConditions.push({ name: /\b(touring|tourer)\b/i });
      else if (c.includes("monsoon") || c.includes("rain-gear")) regexConditions.push({ name: /\b(rain|waterproof|monsoon)\b/i });
      else if (c.includes("women")) regexConditions.push({ name: /\b(women|lady|ladies|stella)\b/i });
      else if (c.includes("top-box")) regexConditions.push({ name: /\b(top.*box|topcase|top.*case)\b/i });
      else if (c.includes("hydration")) regexConditions.push({ name: /\b(hydration|camelbak|water.*bladder)\b/i });
      
      // AUXILIARY LIGHTS & ACCESSORIES (Ordered from specific subcategory to general)
      else if (c.includes("auxiliary-light-filter") || (c.includes("filter") && (c.includes("light") || c.includes("auxiliary")))) {
        regexConditions.push({ name: /\b(filter|filters|lens|lenses)\b/i });
        excludeConditions.push({ name: { $not: /\b(air\s*filter|pinlock|oil\s*filter|clamp|clamps|mount|mounts|bracket|brackets|switch|switches|harness|wire|wiring)\b/i } });
      }
      else if (c.includes("clamp") || (c.includes("mount") && c.includes("light")) || c.includes("clamps-and-mounts")) {
        regexConditions.push({ name: /\b(mount|mounts|clamp|clamps|bracket|brackets)\b/i });
        excludeConditions.push({ name: { $not: /\b(filter|filters|lens|lenses|switch|switches|harness|wire|wiring)\b/i } });
      }
      else if (c.includes("harness") || c.includes("switch")) {
        regexConditions.push({ name: /\b(harness|switch|switches|relay|wire|wiring)\b/i });
        excludeConditions.push({ name: { $not: /\b(filter|filters|lens|lenses|clamp|clamps|mount|mounts|bracket|brackets)\b/i } });
      }
      else if (c.includes("auxiliary-light") || c.includes("auxiliary") || c.includes("light")) {
        regexConditions.push({ name: /\b(auxiliary\s*light|fog\s*light|driving\s*light|led\s*light|hazard\s*flash|flasher)\b/i });
        excludeConditions.push({ name: { $not: /\b(filter|filters|lens|lenses|clamp|clamps|mount|mounts|bracket|brackets|switch|switches|harness|wire|wiring)\b/i } });
      }
      else if (c.includes("exhaust")) {
        regexConditions.push({ name: /\b(exhaust|silencer|db\s*killer|baffle)\b/i });
        excludeConditions.push({ name: { $not: /\b(air\s*filter|oil\s*filter|spark\s*plug|brake)\b/i } });
      }
      else if (c.includes("air-filter") || (c.includes("filter") && !c.includes("light"))) {
        regexConditions.push({ name: /\b(filter|air.*filter)\b/i });
        excludeConditions.push({ name: { $not: /\b(exhaust|silencer|db\s*killer)\b/i } });
      }
      else if (c.includes("performance")) {
        regexConditions.push({ name: /\b(performance|filter|air.*filter|exhaust)\b/i });
      }
      else if (c.includes("cover")) regexConditions.push({ name: /\b(bike\s*cover|motorcycle\s*cover)\b/i });
      else if (c.includes("camera") || c.includes("gopro")) regexConditions.push({ name: /\b(camera|gopro|insta360|action\s*cam)\b/i });
      else if (c.includes("mount") && c.includes("mobile")) regexConditions.push({ name: /\b(mobile.*mount|phone.*mount|ram.*mount)\b/i });

      if (regexConditions.length > 0) {
        // Product MUST match EITHER the Regex OR the Category Tag
        andConditions.push({ $or: [ categoryMatchCondition, ...regexConditions ] });
      } else {
        andConditions.push(categoryMatchCondition);
      }
      
      // Push exclude conditions if any
      if (excludeConditions.length > 0) {
        andConditions.push(...excludeConditions);
      }
    }

    if (brand) {
      const brandsList = brand.split(",").map(b => b.trim()).filter(Boolean);
      const makeBrandCondition = (b: string) => {
        // Strip common suffixes from URLs if present
        const stripped = b.replace(/-(?:riding-gear|adventure-boots-india|chain-sprocket-kits|lights|for-bike)$/i, '');
        // Replace hyphens with a regex that allows both hyphen and space, and allow optional plural/singular
        const flexibleBrand = ProductValidator.escapeRegExp(stripped).replace(/s\b/gi, 's?').replace(/-/g, '[\\s\\-]');
        
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

    const minPrice = searchParams.get("priceFrom") || searchParams.get("minPrice") || searchParams.get("priceMin");
    const maxPrice = searchParams.get("priceTo") || searchParams.get("maxPrice") || searchParams.get("priceMax");
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
      andConditions.push({ 
        $or: [
          { stockStatus: { $gt: 0 } },
          { allowBackorders: true },
          { "variants.stock": { $gt: 0 } }
        ]
      });
    }

    const onSale = searchParams.get("onSale");
    if (onSale === "true" || onSale === "1") {
      andConditions.push({ specialPrice: { $gt: 0 } });
    }

    const featured = searchParams.get("featured") || searchParams.get("isFeatured");
    if (featured === "true" || featured === "1") {
      andConditions.push({ isFeatured: true });
    }

    const size = searchParams.get("size");
    if (size) {
      const sizes = size.split(',').map(s => s.trim()).filter(Boolean);
      // Match "size=X", "eu_size=X", or "eu_size_for_boots=X" inside configurableVariations
      const configVarRegexes = sizes.map(s => new RegExp(`(?:size|eu_size|eu_size_for_boots)=${ProductValidator.escapeRegExp(s)}(\\||,|$)`, "i"));
      const exactRegexes = sizes.map(s => new RegExp(`^${ProductValidator.escapeRegExp(s)}$`, "i"));
      const exactStrings = sizes.flatMap(s => [s, s.toLowerCase(), s.toUpperCase()]);
      const sizeExactMatch = [...new Set([...exactStrings, ...exactRegexes])];
      const skuSizeRegexes = sizes.map(s => new RegExp(`[-_]${ProductValidator.escapeRegExp(s)}(?:[-_]|$)`, "i"));

      // Standard size existence matching (9 conditions)
      andConditions.push({
        $or: [
          {
            $and: [
              { "variants.0": { $exists: false } },
              { configurableVariations: { $in: configVarRegexes } }
            ]
          },
          { "variants.attributes.size": { $in: sizeExactMatch } },
          { "variants.attributes.eu_size": { $in: sizeExactMatch } },
          { "variants.attributes.eu_size_for_boots": { $in: sizeExactMatch } },
          { "attributes.size": { $in: sizeExactMatch } },
          { "attributes.eu_size": { $in: sizeExactMatch } },
          { "attributes.eu_size_for_boots": { $in: sizeExactMatch } },
          { sku: { $in: skuSizeRegexes } },
          { "variants.sku": { $in: skuSizeRegexes } }
        ],
      });

      // On storefront, strictly enforce that the selected size is in stock (or product allows backorders)
      if (!isAdmin) {
        andConditions.push({
          $or: [
            { allowBackorders: true },
            {
              variants: {
                $elemMatch: {
                  $and: [
                    {
                      $or: [
                        { "attributes.size": { $in: sizeExactMatch } },
                        { "attributes.eu_size": { $in: sizeExactMatch } },
                        { "attributes.eu_size_for_boots": { $in: sizeExactMatch } },
                        { sku: { $in: skuSizeRegexes } },
                      ]
                    },
                    { stock: { $gt: 0 } }
                  ]
                }
              }
            },
            {
              $and: [
                { "variants.0": { $exists: false } },
                { stockStatus: { $ne: 0 } },
                { qty: { $gt: 0 } }
              ]
            }
          ]
        });
      }
    }

    const colour = searchParams.get("colour") || searchParams.get("color");
    if (size && colour) {
      const sizes = size.split(',').map(s => s.trim()).filter(Boolean);
      const colours = colour.split(',').map(c => c.trim()).filter(Boolean);
      const sizeExact = sizes.map(s => new RegExp(`^${ProductValidator.escapeRegExp(s)}$`, "i"));
      const colourExact = colours.map(c => new RegExp(`^${ProductValidator.escapeRegExp(c)}$`, "i"));

      const sizeMatchConditions = [
        { "attributes.size": { $in: sizeExact } },
        { "attributes.eu_size": { $in: sizeExact } },
        { "attributes.eu_size_for_boots": { $in: sizeExact } },
      ];
      const colourMatchConditions = [
        { "attributes.color": { $in: colourExact } },
        { "attributes.colour": { $in: colourExact } },
      ];

      // For multi-variant products, require at least ONE variant to match BOTH size & color
      andConditions.push({
        $or: [
          {
            variants: {
              $elemMatch: {
                $and: [
                  { $or: sizeMatchConditions },
                  { $or: colourMatchConditions },
                  ...(!isAdmin ? [{ stock: { $gt: 0 } }] : [])
                ]
              }
            }
          },
          // Standalone / simple product without variants array
          { "variants.0": { $exists: false } },
          ...(!isAdmin ? [{ allowBackorders: true }] : [])
        ]
      });
    }
    if (colour) {
      const colours = colour.split(',').map(c => c.trim()).filter(Boolean);
      // Match "color=X" inside configurableVariations string precisely
      const configVarRegexes = colours.map(c => new RegExp(`color=${ProductValidator.escapeRegExp(c)}(\\||,|$)`, "i"));
      // Match exact value in structured variants.attributes
      const exactRegexes = colours.map(c => new RegExp(`^${ProductValidator.escapeRegExp(c)}$`, "i"));
      const exactStrings = colours.flatMap(c => [
        c,
        c.toLowerCase(),
        c.toUpperCase(),
        c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
      ]);
      const colourExactMatch = [...new Set([...exactStrings, ...exactRegexes])];
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

      // Standard color matching (15 conditions)
      andConditions.push({
        $or: [
          {
            $and: [
              { "variants.0": { $exists: false } },
              { configurableVariations: { $in: configVarRegexes } }
            ]
          },
          { "variants.attributes.color": { $in: colourExactMatch } },
          { "variants.attributes.colour": { $in: colourExactMatch } },
          { "attributes.color": { $in: colourExactMatch } },
          { "attributes.colour": { $in: colourExactMatch } },
          { name: { $in: nameColorRegexes } },
          { sku: { $in: skuColorRegexes } },
          ...colorImageConditions
        ],
      });

      // On storefront, strictly enforce that the selected color is in stock (or product allows backorders)
      if (!isAdmin) {
        andConditions.push({
          $or: [
            { allowBackorders: true },
            {
              variants: {
                $elemMatch: {
                  $and: [
                    {
                      $or: [
                        { "attributes.color": { $in: colourExactMatch } },
                        { "attributes.colour": { $in: colourExactMatch } },
                        { sku: { $in: skuColorRegexes } }
                      ]
                    },
                    { stock: { $gt: 0 } }
                  ]
                }
              }
            },
            {
              $and: [
                { "variants.0": { $exists: false } },
                { stockStatus: { $ne: 0 } },
                { qty: { $gt: 0 } }
              ]
            }
          ]
        });
      }
    }

    const motorcycleModel = searchParams.get("motorcycle_model");
    if (motorcycleModel) {
      const models = motorcycleModel.split(',').map(m => m.trim()).filter(Boolean);
      const exactRegexes = models.map(m => new RegExp(`^${ProductValidator.escapeRegExp(m)}$`, "i"));
      const wordRegexes = models.map(m => new RegExp(`\\b${ProductValidator.escapeRegExp(m)}\\b`, "i"));

      andConditions.push({
        $or: [
          { "attributes.motorcycle_model": { $in: exactRegexes } },
          { "attributes.motorcycle_model": { $in: wordRegexes } },
          { "attributes.bike_compatibility": { $in: exactRegexes } },
          { "attributes.bike_compatibility": { $in: wordRegexes } },
          { "variants.attributes.motorcycle_model": { $in: exactRegexes } },
          { "variants.attributes.bike_compatibility": { $in: exactRegexes } }
        ]
      });

      if (!isAdmin) {
        andConditions.push({
          $or: [
            { allowBackorders: true },
            {
              variants: {
                $elemMatch: {
                  $and: [
                    {
                      $or: [
                        { "attributes.motorcycle_model": { $in: exactRegexes } },
                        { "attributes.motorcycle_model": { $in: wordRegexes } },
                        { "attributes.bike_compatibility": { $in: exactRegexes } },
                        { "attributes.bike_compatibility": { $in: wordRegexes } }
                      ]
                    },
                    { stock: { $gt: 0 } }
                  ]
                }
              }
            },
            {
              $and: [
                { "variants.0": { $exists: false } },
                {
                  $or: [
                    { "attributes.motorcycle_model": { $in: exactRegexes } },
                    { "attributes.motorcycle_model": { $in: wordRegexes } },
                    { "attributes.bike_compatibility": { $in: exactRegexes } },
                    { "attributes.bike_compatibility": { $in: wordRegexes } }
                  ]
                },
                { stockStatus: { $ne: 0 } },
                { qty: { $gt: 0 } }
              ]
            }
          ]
        });
      }
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
      // Resolve search terms with fuzzy typo-tolerance (e.g. 'helmt' -> 'helmet')
      const { terms, correctedTerms } = resolveFuzzySearchTerms(search);
      
      if (terms.length > 0) {
        const searchConditions = terms.map((term, idx) => {
          const corrected = correctedTerms[idx] || term;
          const regexes = [
            new RegExp(ProductValidator.escapeRegExp(term), "i")
          ];

          if (corrected.toLowerCase() !== term.toLowerCase()) {
            regexes.push(new RegExp(ProductValidator.escapeRegExp(corrected), "i"));
          }

          return {
            $or: regexes.flatMap(searchRegex => [
              { name: { $regex: searchRegex } },
              { brand: { $regex: searchRegex } },
              { sku: { $regex: searchRegex } },
              { magentoCategories: { $regex: searchRegex } },
              { "variants.attributes.motorcycle_model": { $regex: searchRegex } },
              { configurableVariations: { $regex: searchRegex } },
            ]),
          };
        });
        
        // $and ensures ALL typed concepts match (either exact or typo-corrected)
        andConditions.push({ $and: searchConditions });

        const exclusionRegex = getGearAccessoryExclusion(correctedTerms.length > 0 ? correctedTerms : terms);
        if (exclusionRegex) {
          andConditions.push({ name: { $not: exclusionRegex } });
        }
      }
    }

    if (andConditions.length === 1) {
      Object.assign(filters, andConditions[0]);
    } else if (andConditions.length > 1) {
      filters.$and = andConditions;
    }

    const sortParam = searchParams.get("sort");
    let sort: Record<string, 1 | -1> = { isFeatured: -1, createdAt: -1, _id: -1 };
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
    } else if (sortParam === "featured" || !sortParam) {
      sort = { isFeatured: -1, createdAt: -1, _id: -1 };
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
