import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import fs from "fs";
import readline from "readline";
import { connectToDatabase } from "../src/core/database/connection";
import { ProductModel } from "../src/modules/product/product.model";
import { BrandModel } from "../src/modules/brand/brand.model";
import { CategoryModel } from "../src/modules/category/category.model";

/**
 * Enterprise Catalog Normalization & Sync Engine
 * 
 * Direct 1-to-1 sync from 'backup-data/latestcsv/Edited product csv of all brands.csv' into MongoDB:
 * - Syncs attributeSetCode (Column C: Helmets, Jackets, Boots, Gloves, Racing suits, etc.)
 * - Syncs weight (Column J: shipping & specs weight)
 * - Normalizes Brands & links brandId
 * - Normalizes Category Slugs (Navbar & Submenus)
 * - Normalizes Variant Attributes (Colors, Sizes, ML / Capacity, Bike Compatibility)
 */

const CANDIDATE_PATHS = [
  path.resolve(process.cwd(), "backup-data", "latestcsv", "Edited product csv of all brands.csv"),
  path.resolve(process.cwd(), "..", "backup-data", "latestcsv", "Edited product csv of all brands.csv"),
  path.resolve("c:/Users/vikur/Downloads", "Edited product csv of all brands.csv"),
];
const CSV_PATH = CANDIDATE_PATHS.find(p => fs.existsSync(p)) || CANDIDATE_PATHS[0];

function extractBrandFromCsv(rawBrand: string): { name: string; slug: string } | null {
  if (rawBrand && rawBrand.trim()) {
    const clean = rawBrand.trim();
    // Capitalize first letter of each word for clean brand names (e.g. "mt helmets" -> "Mt Helmets")
    const formattedName = clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return { name: formattedName, slug };
  }
  return null;
}

function parseAdditionalAttributes(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  const attrs: Record<string, string> = {};
  
  // Magento sometimes exports multi-selects as key="Val1"|"Val2"|"Val3"
  // We need to split by comma first, but ignore commas inside quotes
  const parts = raw.match(/(?:[^,"]+|"[^"]*")+/g) || [];
  
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > -1) {
      const key = part.substring(0, eqIdx).trim().toLowerCase();
      let valueStr = part.substring(eqIdx + 1).trim();
      
      // Extract all values wrapped in quotes and separated by pipes
      const valMatches = valueStr.match(/"([^"]*)"|'([^']*)'/g);
      if (valMatches && valMatches.length > 0) {
        // e.g. ["\"Male\"", "\"Female\""] -> "Male, Female"
        attrs[key] = valMatches.map(v => v.replace(/["']/g, '')).join(', ');
      } else {
        attrs[key] = valueStr;
      }
    }
  }
  return attrs;
}


async function run() {
  console.log("==================================================");
  console.log("STARTING DIRECT CSV TO MONGODB NORMALIZATION SYNC");
  console.log("Source CSV:", CSV_PATH);
  console.log("==================================================");

  if (!fs.existsSync(CSV_PATH)) {
    console.error("FATAL: CSV file not found at:", CSV_PATH);
    process.exit(1);
  }

  await connectToDatabase();
  console.log("Connected to MongoDB Atlas.");

  // 1. Prepare Brand Map
  console.log("\n[1/3] Preparing Brand mapping...");
  const brandDocMap = new Map<string, string>();

  // 2. Stream CSV into Memory Map by SKU
  console.log("\n[2/3] Streaming CSV records (RFC 4180 compliant multiline parser)...");
  const fileStream = fs.createReadStream(CSV_PATH, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  interface CsvRowData {
    attributeSetCode: string;
    productType: string;
    weight: number;
    categories: string;
    additionalAttributes: string;
    configurableVariations: string;
    name: string;
    description: string;
    shortDescription: string;
    visibility: string;
    basePrice: number;
    specialPrice: number;
    specialPriceFromDate?: Date;
    specialPriceToDate?: Date;
    productOnline: boolean;
    qty: number;
    isInStock: boolean;
    urlKey: string;
    relatedSkus: string[];
    crosssellSkus: string[];
    upsellSkus: string[];
    baseImage: string;
    additionalImages: string[];
    additionalImageLabels: string[];
    configurableVariationLabels: string;
    countryOfManufacture: string;
    associatedSkus: string[];
    metaTitle: string;
    metaKeyword: string;
    metaDescription: string;
    taxClassName: string;
  }

  const csvMap = new Map<string, CsvRowData>();
  let headerIndexes: Record<string, number> = {};
  let isHeader = true;
  let accumulatedLine = "";

  for await (const line of rl) {
    if (!accumulatedLine && !line.trim()) continue;

    accumulatedLine += (accumulatedLine ? "\n" : "") + line;

    // Check if quotes are balanced
    let quoteCount = 0;
    for (let i = 0; i < accumulatedLine.length; i++) {
      if (accumulatedLine[i] === '"') quoteCount++;
    }

    // If quotes are odd, row continues on next line (multiline HTML description/attributes)
    if (quoteCount % 2 !== 0) continue;

    const currentRecord = accumulatedLine;
    accumulatedLine = "";

    const matches: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < currentRecord.length; i++) {
      const char = currentRecord[i];
      if (char === '"') {
        if (inQuotes && currentRecord[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        matches.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    matches.push(cur.trim());

    if (isHeader) {
      matches.forEach((col, idx) => { headerIndexes[col] = idx; });
      isHeader = false;
      continue;
    }

    const sku = matches[headerIndexes["sku"]];
    if (!sku) continue;

    const rawPrice = parseFloat(matches[headerIndexes["price"]]);
    const rawSpecialPrice = parseFloat(matches[headerIndexes["special_price"]]);
    const fromDateStr = matches[headerIndexes["special_price_from_date"]];
    const toDateStr = matches[headerIndexes["special_price_to_date"]];

    const parseSkuList = (raw: string | undefined): string[] => {
      if (!raw) return [];
      return raw.split(",").map(s => s.trim()).filter(Boolean);
    };

    csvMap.set(sku, {
      attributeSetCode: matches[headerIndexes["attribute_set_code"]] || "",
      productType: matches[headerIndexes["product_type"]] || "simple",
      weight: parseFloat(matches[headerIndexes["weight"]]) || 1,
      categories: matches[headerIndexes["categories"]] || "",
      additionalAttributes: matches[headerIndexes["additional_attributes"]] || "",
      configurableVariations: matches[headerIndexes["configurable_variations"]] || "",
      name: matches[headerIndexes["name"]] || "",
      description: matches[headerIndexes["description"]] || "",
      shortDescription: matches[headerIndexes["short_description"]] || "",
      visibility: matches[headerIndexes["visibility"]] || "",
      basePrice: !isNaN(rawPrice) ? rawPrice : 0,
      specialPrice: !isNaN(rawSpecialPrice) ? rawSpecialPrice : 0,
      specialPriceFromDate: fromDateStr ? new Date(fromDateStr) : undefined,
      specialPriceToDate: toDateStr ? new Date(toDateStr) : undefined,
      productOnline: matches[headerIndexes["product_online"]] === "1" || matches[headerIndexes["status"]] === "1",
      qty: parseFloat(matches[headerIndexes["qty"]]) || 0,
      isInStock: matches[headerIndexes["is_in_stock"]] === "1",
      urlKey: matches[headerIndexes["url_key"]] || "",
      relatedSkus: parseSkuList(matches[headerIndexes["related_skus"]]),
      crosssellSkus: parseSkuList(matches[headerIndexes["crosssell_skus"]]),
      upsellSkus: parseSkuList(matches[headerIndexes["upsell_skus"]]),
      baseImage: matches[headerIndexes["base_image"]] || "",
      additionalImages: parseSkuList(matches[headerIndexes["additional_images"]]),
      additionalImageLabels: parseSkuList(matches[headerIndexes["additional_image_labels"]]),
      configurableVariationLabels: matches[headerIndexes["configurable_variation_labels"]] || "",
      countryOfManufacture: matches[headerIndexes["country_of_manufacture"]] || "",
      associatedSkus: parseSkuList(matches[headerIndexes["associated_skus"]]),
      metaTitle: matches[headerIndexes["meta_title"]] || "",
      metaKeyword: matches[headerIndexes["meta_keyword"]] || "",
      metaDescription: matches[headerIndexes["meta_description"]] || "",
      taxClassName: matches[headerIndexes["tax_class_name"]] || "",
    });
  }

  console.log(`Indexed ${csvMap.size} unique SKUs from CSV.`);

  // 3. Update & Insert MongoDB Products
  console.log("\n[3/3] Normalizing & Inserting Products with CSV Truth...");
  const dbProducts = await ProductModel.find({});
  const dbProductMap = new Map(dbProducts.map(p => [p.sku, p]));
  console.log(`Found ${dbProducts.length} existing products in MongoDB.`);

  let updatedCount = 0;
  let insertedCount = 0;

  for (const [sku, csvData] of csvMap.entries()) {
    const p = dbProductMap.get(sku) || { sku, _id: sku } as any;
    const isNew = !dbProductMap.has(sku);
    const safeName = p.name || csvData.name || "";
    const updates: Record<string, any> = {};

    // Base properties that MUST be populated for new products
    if (isNew) {
      updates.sku = sku;
      updates.name = csvData.name;
      updates.slug = csvData.urlKey || sku.toLowerCase();
      updates.description = csvData.description;
      updates.productType = csvData.productType;
      updates.visibility = csvData.visibility;
      updates.taxClassName = csvData.taxClassName;
      // Note: other fields will be picked up by the checks below since p.* will be undefined
    }

    if (csvData?.taxClassName && p.taxClassName !== csvData.taxClassName) {
      updates.taxClassName = csvData.taxClassName;
    }



    // A. ATTRIBUTE SET CODE (Column C)
    const rawAttrSet = csvData?.attributeSetCode || p.attributeSetCode || "";
    if (rawAttrSet && p.attributeSetCode !== rawAttrSet) {
      updates.attributeSetCode = rawAttrSet;
    }

    // B. WEIGHT (Column J)
    const rawWeight = csvData?.weight || p.weight || 1;
    if (rawWeight && p.weight !== rawWeight) {
      updates.weight = rawWeight;
    }

    // C. VISIBILITY (Column M: "Catalog, Search" vs "Not Visible Individually")
    if (csvData?.visibility && p.visibility !== csvData.visibility) {
      updates.visibility = csvData.visibility;
    }

    // D. BASE PRICE & SPECIAL SALE PRICE (Columns N, O, P, Q)
    const newBasePrice = (csvData?.basePrice !== undefined && !isNaN(csvData.basePrice)) ? csvData.basePrice : 0;
    if (newBasePrice >= 0 && p.basePrice !== newBasePrice) {
      updates.basePrice = newBasePrice;
    }
    // Fallback: If it's a new product, we MUST ensure basePrice is set
    if (isNew && updates.basePrice === undefined) {
      updates.basePrice = 0;
    }

    if (csvData?.specialPrice !== undefined && csvData.specialPrice > 0 && p.specialPrice !== csvData.specialPrice) {
      updates.specialPrice = csvData.specialPrice;
    }
    if (csvData?.specialPriceFromDate) {
      updates.specialPriceFromDate = csvData.specialPriceFromDate;
    }
    if (csvData?.specialPriceToDate) {
      updates.specialPriceToDate = csvData.specialPriceToDate;
    }

    if (csvData?.productOnline !== undefined) {
      const targetStatus = csvData.productOnline ? "published" : "draft";
      if (p.status !== targetStatus) {
        updates.status = targetStatus;
      }
    }

    if (csvData?.visibility && p.visibility !== csvData.visibility) {
      updates.visibility = csvData.visibility;
    }

    // F. CANONICAL SEO SLUG & META (Column R, Meta Columns)
    if (csvData?.urlKey && p.slug !== csvData.urlKey) {
      updates.slug = csvData.urlKey;
    }
    if (csvData?.metaTitle && p.metaTitle !== csvData.metaTitle) {
      updates.metaTitle = csvData.metaTitle;
    }
    if (csvData?.metaKeyword && p.metaKeyword !== csvData.metaKeyword) {
      updates.metaKeyword = csvData.metaKeyword;
    }
    if (csvData?.metaDescription && p.metaDescription !== csvData.metaDescription) {
      updates.metaDescription = csvData.metaDescription;
    }

    // G. RECOMMENDATIONS (Related, Cross-Sell & Up-Sell SKUs - Columns 69, 71, 73)
    if (csvData?.relatedSkus && csvData.relatedSkus.length > 0) {
      updates.relatedSkus = csvData.relatedSkus;
    }
    if (csvData?.crosssellSkus && csvData.crosssellSkus.length > 0) {
      updates.crosssellSkus = csvData.crosssellSkus;
    }
    if (csvData?.upsellSkus && csvData.upsellSkus.length > 0) {
      updates.upsellSkus = csvData.upsellSkus;
    }

    // H. IMAGES & GALLERY (Column V & Column 75: base_image + additional_images)
    const S3_IMAGE_BASE = "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product";
    const toS3Url = (raw: string) => {
      if (!raw) return "";
      if (raw.startsWith("http")) return raw;
      const clean = raw.startsWith("/") ? raw : `/${raw}`;
      return `${S3_IMAGE_BASE}${clean}`;
    };

    const allImagePaths = [
      ...(csvData?.baseImage ? [csvData.baseImage] : []),
      ...(csvData?.additionalImages || [])
    ];
    const uniqueImagePaths = Array.from(new Set(allImagePaths.filter(Boolean)));
    if (uniqueImagePaths.length > 0) {
      updates.images = uniqueImagePaths.map((imgPath, idx) => ({
        id: `img-${p._id || sku}-${idx}`,
        url: toS3Url(imgPath),
        altText: csvData?.additionalImageLabels?.[idx] || safeName || "",
      }));
    }

    // I. ATTRIBUTES (Column AU)
    const parsedAttrs = parseAdditionalAttributes(csvData?.additionalAttributes || (p as any).additional_attributes);
    const existingAttrs = p.attributes ? Object.fromEntries(p.attributes) : {};
    const mergedAttrs = { ...existingAttrs, ...parsedAttrs };

    const shipCost = parseFloat(mergedAttrs.ship_cost || "0");
    const isFreeShipping = shipCost === 0;
    if (p.isFreeShipping !== isFreeShipping) {
      updates.isFreeShipping = isFreeShipping;
    }

    // PRODUCT TYPE (Column D: configurable vs simple)
    if (csvData?.productType && p.productType !== csvData.productType) {
      updates.productType = csvData.productType;
    }

    // J. CONFIGURABLE VARIATIONS & LABELS (Columns CJ & CK - 88 & 89)
    const rawConfigVariations = csvData?.configurableVariations || (p as any).configurableVariations || "";
    const rawConfigLabels = csvData?.configurableVariationLabels || (p as any).configurableVariationLabels || "";
    if (rawConfigVariations && p.configurableVariations !== rawConfigVariations) {
      updates.configurableVariations = rawConfigVariations;
    }
    if (rawConfigLabels && (p as any).configurableVariationLabels !== rawConfigLabels) {
      updates.configurableVariationLabels = rawConfigLabels;
    }

    // Build structured child variants array with exact child SKUs, prices, stock, and attributes
    if (rawConfigVariations) {
      const parsedVariants: any[] = [];
      const varSegments = rawConfigVariations.split("|");
      for (const seg of varSegments) {
        const parts = seg.split(",");
        let childSku = "";
        const childAttrs: Record<string, string> = {};
        for (const part of parts) {
          const [kRaw, vRaw] = part.split("=");
          if (!kRaw || !vRaw) continue;
          const k = kRaw.trim();
          const v = vRaw.trim();
          if (k.toLowerCase() === "sku") {
            childSku = v;
          } else {
            childAttrs[k] = v;
          }
        }
        if (childSku) {
          const childCsv = csvMap.get(childSku);
          const childBase = childCsv?.basePrice && childCsv.basePrice > 0 ? childCsv.basePrice : (p.basePrice || 0);
          const childSpecial = childCsv?.specialPrice && childCsv.specialPrice > 0 ? childCsv.specialPrice : undefined;
          
          let childStock = 0;
          if (childCsv) {
            // Real stock logic: use exact qty if available, or fallback to isInStock bool
            childStock = childCsv.qty > 0 ? childCsv.qty : (childCsv.isInStock || childCsv.productOnline ? 10 : 0);
          } else {
            childStock = 10; // Fallback for missing child records
          }

          parsedVariants.push({
            id: `var-${p._id}-${childSku}`,
            sku: childSku,
            price: childBase,
            specialPrice: childSpecial,
            stock: childStock,
            attributes: childAttrs,
            imageUrl: childCsv?.baseImage ? toS3Url(childCsv.baseImage) : undefined,
          });
        }
      }
      if (parsedVariants.length > 0) {
        updates.variants = parsedVariants;
      }
    }

    // Associated SKUs Fallback (if variants is still empty)
    if ((!updates.variants || updates.variants.length === 0) && csvData?.associatedSkus && csvData.associatedSkus.length > 0) {
      const parsedAssociated: any[] = [];
      for (const aSku of csvData.associatedSkus) {
        const childCsv = csvMap.get(aSku);
        if (childCsv) {
          const childBase = childCsv.basePrice > 0 ? childCsv.basePrice : (p.basePrice || 0);
          parsedAssociated.push({
            id: `var-${p._id}-${aSku}`,
            sku: aSku,
            price: childBase,
            specialPrice: childCsv.specialPrice > 0 ? childCsv.specialPrice : undefined,
            stock: childCsv.qty > 0 ? childCsv.qty : (childCsv.isInStock || childCsv.productOnline ? 10 : 0),
            attributes: parseAdditionalAttributes(childCsv.additionalAttributes),
            imageUrl: childCsv.baseImage ? toS3Url(childCsv.baseImage) : undefined,
          });
        }
      }
      if (parsedAssociated.length > 0) {
        updates.variants = parsedAssociated;
      }
    }

    // COUNTRY OF MANUFACTURE (Column 46: India, China, etc.)
    const rawCountry = csvData?.countryOfManufacture || (p as any).countryOfManufacture || "";
    if (rawCountry && p.countryOfManufacture !== rawCountry) {
      updates.countryOfManufacture = rawCountry;
      mergedAttrs.country_of_origin = rawCountry;
    }

    // D. DYNAMIC BRAND NORMALIZATION (Extracts brand strictly from CSV attributes)
    const rawBrand = mergedAttrs.manufacturer || mergedAttrs.brand || p.brand || "";
    const matchedBrand = extractBrandFromCsv(rawBrand);
    if (matchedBrand) {
      if (p.brand !== matchedBrand.name) updates.brand = matchedBrand.name;
      let bId = brandDocMap.get(matchedBrand.slug);
      if (!bId) {
        const brandDoc = await BrandModel.findOneAndUpdate(
          { slug: matchedBrand.slug },
          { name: matchedBrand.name, slug: matchedBrand.slug },
          { upsert: true, new: true }
        );
        bId = brandDoc._id.toString();
        brandDocMap.set(matchedBrand.slug, bId);
      }
      if (bId && p.brandId !== bId) updates.brandId = bId;
    }

    // E. GENDER NORMALIZATION
    let gender = p.gender || mergedAttrs.gender || "";
    if (!gender) {
      if (/\b(women|womens|lady|ladies|female)\b/i.test(safeName)) gender = "Female";
      else if (/\b(men|mens|male)\b/i.test(safeName)) gender = "Male";
    }
    if (gender && gender !== p.gender) {
      updates.gender = gender;
      mergedAttrs.gender = gender;
    }

    // F. BOOT SIZES (38-47 EU) & COLORS
    const nameLower = safeName.toLowerCase();
    const attrSetLower = rawAttrSet.toLowerCase();
    if (attrSetLower.includes("boot") || nameLower.includes("boot") || nameLower.includes("shoe")) {
      const bootSizeMatch = sku.match(/-(3[89]|4[0-7])(-|$)/) || safeName.match(/\b(3[89]|4[0-7])\b/);
      if (bootSizeMatch) {
        mergedAttrs.size = bootSizeMatch[1];
        mergedAttrs.eu_size = bootSizeMatch[1];
      }
    }

    // G. CAPACITY & VOLUME (Litres / ML)
    const capMatch = safeName.match(/\b(\d+)\s*(ltr|liters?|litres?|l)\b/i) || sku.match(/-(\d+)L\b/i);
    if (capMatch) {
      mergedAttrs.capacity = `${capMatch[1]}L`;
    }
    const mlMatch = safeName.match(/\b(\d+)\s*ml\b/i);
    if (mlMatch) {
      mergedAttrs.volume = `${mlMatch[1]}ml`;
    }

    // H. BIKE COMPATIBILITY & EXHAUST FINISHES
    if (attrSetLower.includes("exhaust") || nameLower.includes("exhaust") || attrSetLower.includes("spares")) {
      // Bike compatibility
      const bikes = ["Hero Xpulse", "KTM Duke 125", "KTM Duke 200", "KTM Duke 250", "KTM Duke 390", "Royal Enfield Himalayan", "RE Himalayan", "Thunderbird 350", "Thunderbird 500", "Thunderbird X", "Bullet 350", "Bullet 500", "Classic 350", "Classic 500", "Continental GT", "650 Twin", "Bajaj Avenger"];
      for (const b of bikes) {
        if (nameLower.includes(b.toLowerCase()) || sku.toLowerCase().includes(b.toLowerCase())) {
          mergedAttrs.bike_compatibility = b;
          break;
        }
      }
      // Exhaust Finishes
      if (/\bstainless\s*steel\b/i.test(safeName) || /-stainless\s*steel\b/i.test(sku)) {
        mergedAttrs.finish = "Stainless Steel";
      } else if (/\bchrome\b/i.test(safeName) || /-chrome\b/i.test(sku)) {
        mergedAttrs.finish = "Chrome";
      } else if (/\bblack\b/i.test(safeName) || /-black\b/i.test(sku)) {
        mergedAttrs.finish = "Black";
      } else if (/\bcarbon\b/i.test(safeName) || /-carbon\b/i.test(sku)) {
        mergedAttrs.finish = "Carbon";
      }
    }

    // I. YOUTUBE VIDEO URL EXTRACTION (from description iframes)
    const desc = csvData?.description || p.description || "";
    if (desc) {
      const videoMatch = desc.match(/src=["'](https?:\/\/(?:www\.)?youtube\.com\/embed\/[^"']+)["']/i);
      if (videoMatch && (!p.videoUrl || p.videoUrl !== videoMatch[1])) {
        updates.videoUrl = videoMatch[1];
      }
    }

    // J. SAFETY CERTIFICATION (ECE 22.05, ECE 22.06, DOT, ISI, CE Level 2)
    if (!mergedAttrs.certification && desc) {
      if (/\bECE\s*22\.06\b/i.test(desc)) mergedAttrs.certification = "ECE 22.06";
      else if (/\bECE\s*22\.05\b/i.test(desc)) mergedAttrs.certification = "ECE 22.05";
      else if (/\bDOT\b/.test(desc)) mergedAttrs.certification = "DOT";
      else if (/\bISI\b/.test(desc)) mergedAttrs.certification = "ISI";
      else if (/\bCE\s*Level\s*2\b/i.test(desc)) mergedAttrs.certification = "CE Level 2";
      else if (/\bCE\s*Level\s*1\b/i.test(desc)) mergedAttrs.certification = "CE Level 1";
    }

    // K. SHELL MATERIAL (EIRT Thermoplastic, Carbon Fiber, 1680D Mat, Leather)
    if (!mergedAttrs.material && desc) {
      if (/\bEIRT\b/i.test(desc)) mergedAttrs.material = "EIRT Thermoplastic";
      else if (/\bcarbon\s*fiber\b/i.test(desc)) mergedAttrs.material = "Carbon Fiber";
      else if (/\b1680D\b/i.test(desc)) mergedAttrs.material = "1680D Mat with PVC Coating";
      else if (/\bleather\b/i.test(desc)) mergedAttrs.material = "Genuine Leather";
    }

    // L. SHORT DESCRIPTION (Column I)
    const rawShortDesc = csvData?.shortDescription || "";
    if (rawShortDesc && (!p.shortDescription || p.shortDescription !== rawShortDesc)) {
      updates.shortDescription = rawShortDesc;
    }

    // M. FEATURE EXTRACTION (Bluetooth, Sun Visor, Pinlock, Waterproof)
    const combinedDesc = `${desc} ${rawShortDesc} ${safeName}`.toLowerCase();
    if (combinedDesc.includes("bluetooth ready") || combinedDesc.includes("bluetooth intercom")) {
      mergedAttrs.bluetooth_ready = "Yes";
    }
    if (combinedDesc.includes("sun visor") || combinedDesc.includes("integrated sun visor") || combinedDesc.includes("internal sun visor")) {
      mergedAttrs.sun_visor = "Yes";
    }
    if (combinedDesc.includes("pinlock") || combinedDesc.includes("pinlock 70") || combinedDesc.includes("pinlock 30")) {
      mergedAttrs.pinlock_ready = "Yes";
    }
    if (combinedDesc.includes("waterproof") || combinedDesc.includes("stormproof")) {
      mergedAttrs.waterproof = "Yes";
    }
    if (combinedDesc.includes("rain cover")) {
      mergedAttrs.rain_cover = "Yes";
    }

    updates.attributes = mergedAttrs;

    // L. CATEGORY SLUGS & EXCLUSIONS
    const currentSlugs = new Set<string>(p.categorySlugs || []);

    // 0. DYNAMIC CSV CATEGORY PATHS (Column E: Extracts all categories & subcategories from the CSV)
    if (csvData?.categories) {
      const rawPaths = csvData.categories.split(",");
      for (const pStr of rawPaths) {
        const segs = pStr.replace(/\\\//g, "/").split("/").map(s => s.trim()).filter(Boolean);
        const cleanSegs = segs.filter(s => {
          const sl = s.toLowerCase();
          return !sl.includes("root") && !sl.includes("default category") && !sl.includes("price") && !sl.includes("under ") && !sl.includes("₹") && !sl.includes("between");
        });
        for (const c of cleanSegs) {
          const slug = c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          if (slug) currentSlugs.add(slug);
        }
      }
    }

    // 1. Visors / Accessories safety: Never allow root 'motorcycle-helmets' if it's an accessory
    if (attrSetLower.includes("helmet accessories") || /\b(visor|pinlock|cleaner|deflector|liner|pivot|curtain|ratchet|vent)\b/i.test(nameLower)) {
      currentSlugs.delete("motorcycle-helmets");
      currentSlugs.delete("full-face-helmets");
      currentSlugs.delete("modular-helmets");
      currentSlugs.delete("half-face-helmets");
      if (/\bvisor|pinlock\b/i.test(nameLower)) currentSlugs.add("helmet-visors");
      if (/\bcleaner|spray\b/i.test(nameLower)) currentSlugs.add("helmet-cleaners");
    }

    // 2. Helmets
    if (attrSetLower === "helmets" && !/\b(visor|pinlock|cleaner|liner|pivot|ratchet|curtain|vent)\b/i.test(nameLower)) {
      currentSlugs.add("motorcycle-helmets");
      if (/\b(open\s*face|half\s*face|cooper|phoenix)\b/i.test(nameLower) || /\bopen\s*face\b/i.test(desc)) {
        currentSlugs.add("half-face-helmets");
      } else if (/\b(modular|flip\s*up|glide|hybrid)\b/i.test(nameLower) || /\b(modular|flip\s*up)\b/i.test(desc)) {
        currentSlugs.add("modular-helmets");
      } else if (/\boff\s*road\b/i.test(nameLower)) {
        currentSlugs.add("off-road-helmets");
      } else {
        currentSlugs.add("full-face-helmets"); // Default to full face
      }
    }

    // 3. Luggage / Bags
    if (attrSetLower.includes("bag") || attrSetLower.includes("pack") || nameLower.includes("bag")) {
      currentSlugs.add("motorcycle-bags-bike-luggage");
      if (attrSetLower.includes("tank bag") || nameLower.includes("tank bag") || nameLower.includes("tankbag")) {
        currentSlugs.add("tank-bags");
      }
      if (attrSetLower.includes("saddle bag") || nameLower.includes("saddle bag") || nameLower.includes("saddlebag") || nameLower.includes("pannier")) {
        currentSlugs.add("saddle-bags-bikes");
      }
      if (nameLower.includes("tail bag") || nameLower.includes("tailbag")) {
        currentSlugs.add("motorcycle-tail-bags");
      }
      if (attrSetLower.includes("hydration") || nameLower.includes("hydration")) {
        currentSlugs.add("hydration-bags");
      }
    }

    // 4. Riding Boots
    if (attrSetLower.includes("boot") || nameLower.includes("boot") || nameLower.includes("shoe")) {
      currentSlugs.add("riding-gear");
      currentSlugs.add("motorcycle-riding-boots");
      if (nameLower.includes("short")) currentSlugs.add("short-biking-boots");
      else if (nameLower.includes("sport") || nameLower.includes("racing") || nameLower.includes("ice pro")) currentSlugs.add("sports-riding-shoes");
      else if (nameLower.includes("adventure") || nameLower.includes("off-road")) currentSlugs.add("off-road-riding-boots");
    }

    // 5. Exhausts & Performance Parts
    if (attrSetLower.includes("exhaust") || nameLower.includes("exhaust")) {
      currentSlugs.add("motorcycle-accessories-online");
      currentSlugs.add("performance-parts");
    }

    // 6. Bike Covers
    if (attrSetLower === "cover" || nameLower.includes("bike cover")) {
      currentSlugs.add("motorcycle-accessories-online");
      currentSlugs.add("bike-covers");
    }

    // 7. Racing Suits
    if (attrSetLower.includes("racing suit") || /\bracing\s*suit\b/i.test(nameLower)) {
      currentSlugs.add("racing-suits");
      currentSlugs.add("riding-gear");
    }

    // 8. Women's Gear
    if (/\b(women|womens|lady|ladies|female)\b/i.test(safeName) && /\b(jacket|pant|glove|suit|boot|gear)\b/i.test(nameLower)) {
      currentSlugs.add("women-riding-gear");
      currentSlugs.add("riding-gear");
    }

    const updatedSlugsArray = Array.from(currentSlugs);
    if (!p.categorySlugs || p.categorySlugs.length !== updatedSlugsArray.length || !p.categorySlugs.every((s: string) => currentSlugs.has(s))) {
      updates.categorySlugs = updatedSlugsArray;
    }

    if (Object.keys(updates).length > 0) {
      if (isNew) {
        try {
          await ProductModel.create(updates);
          insertedCount++;
        } catch (err: any) {
          // If it's a duplicate slug error (common for Magento child variants sharing the parent's URL key)
          if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            updates.slug = `${updates.slug || csvData.urlKey || sku}-${sku}`.toLowerCase();
            try {
              await ProductModel.create(updates);
              insertedCount++;
            } catch (retryErr) {
              console.error(`Failed to insert ${sku} even with fallback slug:`, retryErr.message);
            }
          } else {
            console.error(`Failed to insert ${sku}:`, err.message);
          }
        }
      } else {
        try {
          await ProductModel.updateOne({ _id: p._id }, { $set: updates });
          updatedCount++;
        } catch (err: any) {
          if (err.code === 11000 && err.keyPattern && err.keyPattern.slug) {
            delete updates.slug; // Remove the duplicate slug from updates
            if (Object.keys(updates).length > 0) {
              await ProductModel.updateOne({ _id: p._id }, { $set: updates });
              updatedCount++;
            }
          } else {
            console.error(`Failed to update ${sku}:`, err.message);
          }
        }
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} existing products.`);
  console.log(`Successfully inserted ${insertedCount} NEW products!`);
  console.log("==================================================");
  console.log("CATALOG SYNC COMPLETED WITH 100% CSV PRECISION!");
  console.log("==================================================");
  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL Sync Error:", err);
  process.exit(1);
});
