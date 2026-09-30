/**
 * @file import-full-catalog.ts
 * @description ROBUST CSV-to-MongoDB Product Import Script for Store4Riders.
 *
 * This script completely replaces the product collection with data from the new CSV.
 * It handles ALL field mappings including:
 *  - Configurable product price derivation from child variants
 *  - Special price (discount) for both parent and variant level
 *  - Complete variant extraction with size, color, price, specialPrice, stock
 *  - Gallery images (base + additional) from both parent and child rows
 *  - Related SKUs (Complete Your Kit), Upsell SKUs (You May Also Like), Crosssell SKUs
 *  - Brand, Gender, Country of Manufacture from additional_attributes + CSV columns
 *  - Ship cost → isFreeShipping derivation
 *  - Size chart from additional_attributes (size_chart_01)
 *  - Configurable variation labels
 *  - Attribute set code
 *  - Stock status & qty (aggregated from children for configurable products)
 *  - Description & short description with Magento media URL resolution
 *  - Product status set to "published"
 *
 * Usage:
 *   npx tsx backup-data/import-full-catalog.ts
 *
 * Prerequisites:
 *   - MONGODB_URI or DATABASE_URL env var set
 *   - CSV file must exist at CSV_FILE_PATH
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables — try root .env, then backend .env
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

// ──────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────
const CSV_FILE_PATH = 'C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv';
const S3_BASE_URL = 'https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product';
const MAGENTO_MEDIA_BASE = 'https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product';
const BATCH_SIZE = 50;

// ──────────────────────────────────────────────────────────────
// Mongoose Schema (mirrors backend/src/modules/product/product.model.ts EXACTLY)
// This script runs standalone, so we define the schema inline.
// ──────────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    categoryId: { type: String, index: true },
    basePrice: { type: Number, required: true },
    specialPrice: { type: Number },
    weight: { type: Number },
    stockStatus: { type: Number },
    productType: { type: String },
    magentoCategories: { type: String },
    configurableVariations: { type: String },
    shortDescription: { type: String },
    metaTitle: { type: String },
    metaKeywords: { type: String },
    metaDescription: { type: String },
    relatedSkus: [{ type: String }],
    upsellSkus: [{ type: String }],
    crosssellSkus: [{ type: String }],
    brand: { type: String },
    gender: { type: String },
    countryOfManufacture: { type: String },
    attributeSetCode: { type: String },
    configurableVariationLabels: { type: String },
    qty: { type: Number, default: 0 },
    sizeChart: { type: String },
    size_chart: { type: String },
    isFreeShipping: { type: Boolean, default: false },
    images: [
      {
        id: { type: String },
        url: { type: String, required: true },
        altText: { type: String },
      },
    ],
    variants: [
      {
        id: { type: String },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        specialPrice: { type: Number },
        stock: { type: Number, default: 0 },
        attributes: { type: Map, of: String },
      },
    ],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String }],
    videoUrl: { type: String },
    documents: [
      {
        name: { type: String },
        url: { type: String },
      },
    ],
    salesCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// High-performance query and sorting indexes
productSchema.index({ brand: 1 });
productSchema.index({ basePrice: 1, _id: -1 });
productSchema.index({ basePrice: -1, _id: -1 });
productSchema.index({ createdAt: -1, _id: -1 });
productSchema.index({ salesCount: -1, _id: -1 });
productSchema.index({ avgRating: -1, _id: -1 });

const ProductModel =
  mongoose.models.Product || mongoose.model('Product', productSchema);

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

/** Full child SKU info collected during Pass 1 */
interface ChildSkuInfo {
  price: number;
  specialPrice: number | null; // null = no special price
  qty: number;
  isInStock: number;
  baseImage: string;
  additionalImages: string;
  additionalImageLabels: string;
  baseImageLabel: string;
  additionalAttributes: string;
  name: string;
  weight: number;
  countryOfManufacture: string;
}

/** Parsed additional_attributes key-value pairs */
interface ParsedAttributes {
  brand?: string;
  gender?: string;
  ship_cost?: string;
  condition?: string;
  color?: string;
  size?: string;
  codazon_custom_tab?: string;
  size_chart_01?: string;
  eu_size_for_boots?: string;
  [key: string]: string | undefined;
}

// ──────────────────────────────────────────────────────────────
// Global State
// ──────────────────────────────────────────────────────────────

// Map: childSKU → full child data (built in Pass 1)
const skuIndex = new Map<string, ChildSkuInfo>();

// ──────────────────────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────────────────────

async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('MONGODB_URI or DATABASE_URL is not defined in .env');
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

/**
 * Parses Magento's additional_attributes string into key-value pairs.
 *
 * Format examples:
 *   color="Black",condition="New",brand="Biking Brotherhood",ship_cost="250.000000"
 *   condition="New",gender="Male"|"Female"|"Unisex",brand="Rynox Gear"
 *
 * Handles:
 *   - Quoted values: key="value"
 *   - Multi-value with pipes: gender="Male"|"Female"|"Unisex"
 *   - Values containing commas inside quotes (codazon_custom_tab with HTML)
 */
function parseAdditionalAttributes(attrStr: string): ParsedAttributes {
  if (!attrStr || typeof attrStr !== 'string') return {};

  const result: ParsedAttributes = {};

  // State-based parser for robustness with complex HTML values
  let i = 0;
  const len = attrStr.length;

  while (i < len) {
    // Skip whitespace
    while (i < len && attrStr[i] === ' ') i++;

    // Find key (everything before '=')
    let keyStart = i;
    while (i < len && attrStr[i] !== '=') i++;
    if (i >= len) break;

    const key = attrStr.substring(keyStart, i).trim();
    i++; // skip '='

    // Find value
    let value = '';
    if (i < len && attrStr[i] === '"') {
      // Quoted value — find matching close quote
      i++; // skip opening quote
      let valueStart = i;
      let depth = 0;

      while (i < len) {
        if (attrStr[i] === '"') {
          // Check if followed by '|"' (multi-value) or '""' (escaped quote)
          if (i + 1 < len && attrStr[i + 1] === '|' && i + 2 < len && attrStr[i + 2] === '"') {
            // Multi-value: "Male"|"Female" — include the pipe
            i += 2; // skip '"|', now at next '"'
            i++; // skip that '"'
            continue;
          } else if (i + 1 < len && attrStr[i + 1] === '"') {
            // Escaped quote "" inside value (like codazon_custom_tab with HTML)
            i += 2;
            continue;
          } else {
            // End of value
            value = attrStr.substring(valueStart, i);
            i++; // skip closing quote
            break;
          }
        }
        i++;
      }

      // Clean up escaped double quotes
      value = value.replace(/""/g, '"');
    } else {
      // Unquoted value — read until comma
      let valueStart = i;
      while (i < len && attrStr[i] !== ',') i++;
      value = attrStr.substring(valueStart, i).trim();
    }

    if (key) {
      result[key] = value;
    }

    // Skip comma separator
    if (i < len && attrStr[i] === ',') i++;
  }

  return result;
}

/**
 * Extracts brand from additional_attributes, falls back to first word of product name.
 */
function extractBrand(attrs: ParsedAttributes, productName: string): string {
  if (attrs.brand) return attrs.brand.trim();
  // Fallback: first word of product name
  return (productName || '').split(' ')[0] || 'Unknown';
}

/**
 * Extracts gender from additional_attributes.
 * Handles multi-value like "Male"|"Female"|"Unisex" → "Male, Female, Unisex"
 */
function extractGender(attrs: ParsedAttributes): string | undefined {
  if (!attrs.gender) return undefined;
  // Clean up pipe-separated quoted values
  return attrs.gender
    .replace(/"/g, '')
    .split('|')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Determines if product has free shipping based on ship_cost attribute.
 * ship_cost="0.000000" means free shipping.
 */
function isFreeShipping(attrs: ParsedAttributes): boolean {
  if (!attrs.ship_cost) return false;
  const cost = parseFloat(attrs.ship_cost);
  return !isNaN(cost) && cost === 0;
}

/**
 * Generates a URL-safe slug from url_key or name.
 */
function generateSlug(urlKey: string, name: string): string {
  const base = (urlKey || name || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return base || 'product';
}

/**
 * Resolves Magento media URLs in HTML descriptions.
 *
 * Converts patterns like:
 *   {{media url="wysiwyg/image.jpg"}}
 *   {{media url=wysiwyg/image.jpg}}
 *
 * To full S3 URLs.
 */
function resolveDescriptionMediaUrls(html: string): string {
  if (!html) return '';
  // Replace Magento {{media url="..."}} or {{media url=...}} patterns
  return html.replace(
    /\{\{media\s+url="?([^"}\s]+)"?\s*\}\}/gi,
    `${MAGENTO_MEDIA_BASE}/$1`
  );
}

/**
 * Builds full S3 image URL from a relative path.
 * Handles paths with or without leading slash.
 */
function buildImageUrl(imgPath: string): string {
  if (!imgPath || typeof imgPath !== 'string') return '';
  const cleanPath = imgPath.trim();
  if (!cleanPath) return '';
  // If it's already a full URL, return as-is
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
  const relativePath = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
  return `${S3_BASE_URL}${relativePath}`;
}

/**
 * Extracts all images from a CSV row (base_image + additional_images).
 * Returns deduplicated image array.
 */
function extractImages(row: any): Array<{ id: string; url: string; altText: string }> {
  const images: Array<{ id: string; url: string; altText: string }> = [];
  const addedUrls = new Set<string>();

  const addImage = (imgPath: string, altText: string) => {
    const fullUrl = buildImageUrl(imgPath);
    if (!fullUrl || addedUrls.has(fullUrl)) return;
    addedUrls.add(fullUrl);
    images.push({
      id: new mongoose.Types.ObjectId().toString(),
      url: fullUrl,
      altText: altText || '',
    });
  };

  // Base image first
  if (row.base_image) {
    addImage(row.base_image, row.base_image_label || '');
  }

  // Additional images
  if (row.additional_images) {
    const additionalPaths = row.additional_images.split(',').map((s: string) => s.trim());
    const additionalLabels = row.additional_image_labels
      ? row.additional_image_labels.split(',').map((s: string) => s.trim())
      : [];

    additionalPaths.forEach((imgPath: string, idx: number) => {
      addImage(imgPath, additionalLabels[idx] || '');
    });
  }

  return images;
}

/**
 * Extracts images from child SKU data and merges with parent images.
 * This ensures configurable product gallery includes all variant images.
 */
function mergeChildImages(
  parentImages: Array<{ id: string; url: string; altText: string }>,
  childSkus: string[]
): Array<{ id: string; url: string; altText: string }> {
  const addedUrls = new Set<string>(parentImages.map(img => img.url));
  const merged = [...parentImages];

  for (const childSku of childSkus) {
    const childInfo = skuIndex.get(childSku);
    if (!childInfo) continue;

    const addImage = (imgPath: string, altText: string) => {
      const fullUrl = buildImageUrl(imgPath);
      if (!fullUrl || addedUrls.has(fullUrl)) return;
      addedUrls.add(fullUrl);
      merged.push({
        id: new mongoose.Types.ObjectId().toString(),
        url: fullUrl,
        altText: altText || '',
      });
    };

    // Child base image
    if (childInfo.baseImage) {
      addImage(childInfo.baseImage, childInfo.baseImageLabel || '');
    }

    // Child additional images
    if (childInfo.additionalImages) {
      const paths = childInfo.additionalImages.split(',').map((s: string) => s.trim());
      const labels = childInfo.additionalImageLabels
        ? childInfo.additionalImageLabels.split(',').map((s: string) => s.trim())
        : [];
      paths.forEach((imgPath: string, idx: number) => {
        addImage(imgPath, labels[idx] || '');
      });
    }
  }

  return merged;
}

/**
 * Splits a comma-separated SKU string into a clean array.
 * Filters out empty strings and trims whitespace.
 */
function splitSkus(skuString: string | undefined): string[] {
  if (!skuString || typeof skuString !== 'string') return [];
  return skuString
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
}

/**
 * Safely parses a numeric string, returns fallback if invalid.
 */
function safeParseFloat(value: string | undefined | null, fallback: number = 0): number {
  if (value === undefined || value === null || value === '') return fallback;
  const num = parseFloat(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Determines if a special price is a genuine discount.
 * Returns the special price if it's lower than base price, otherwise null.
 */
function getValidSpecialPrice(price: number, specialPrice: number | null): number | undefined {
  if (specialPrice === null || specialPrice === undefined) return undefined;
  if (specialPrice <= 0) return undefined;
  if (specialPrice >= price) return undefined; // Not a discount if equal or higher
  return specialPrice;
}

// ──────────────────────────────────────────────────────────────
// Pass 1: Build complete SKU index
// Indexes ALL rows (including children) for variant data lookup.
// ──────────────────────────────────────────────────────────────

async function buildSkuIndex(): Promise<void> {
  console.log('\n📋 Pass 1: Building complete SKU index from CSV...');
  return new Promise((resolve, reject) => {
    let count = 0;
    const fileStream = fs.createReadStream(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      step: (results) => {
        const row: any = results.data;
        if (!row.sku) return;

        const price = safeParseFloat(row.price);
        const sp = safeParseFloat(row.special_price);

        skuIndex.set(row.sku, {
          price,
          specialPrice: sp > 0 ? sp : null,
          qty: safeParseFloat(row.qty),
          isInStock: safeParseFloat(row.is_in_stock),
          baseImage: row.base_image || '',
          additionalImages: row.additional_images || '',
          additionalImageLabels: row.additional_image_labels || '',
          baseImageLabel: row.base_image_label || '',
          additionalAttributes: row.additional_attributes || '',
          name: row.name || '',
          weight: safeParseFloat(row.weight),
          countryOfManufacture: row.country_of_manufacture || '',
        });
        count++;
      },
      complete: () => {
        console.log(`   ✅ Pass 1 complete. Indexed ${skuIndex.size} SKUs from ${count} rows.`);
        resolve();
      },
      error: (err: any) => reject(err),
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Pass 2: Process and import visible products
// Only imports configurable + standalone simple (Catalog, Search).
// ──────────────────────────────────────────────────────────────

async function processProducts(): Promise<void> {
  console.log('\n📦 Pass 2: Processing and importing visible products...\n');

  let batch: any[] = [];
  let totalParsed = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Track detailed skip/error reasons
  const skipReasons: Record<string, number> = {};
  const errorDetails: Array<{ sku: string; error: string }> = [];

  // Track slugs to avoid duplicates within this import run
  const slugCounts = new Map<string, number>();

  const getUniqueSlug = (baseSlug: string): string => {
    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);
    return count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
  };

  const processBatch = async (): Promise<void> => {
    if (batch.length === 0) return;

    try {
      const ops = batch.map((doc) => ({
        updateOne: {
          filter: { sku: doc.sku },
          update: { $set: doc },
          upsert: true,
        },
      }));

      await ProductModel.bulkWrite(ops);
      totalImported += batch.length;
      console.log(`   📥 Imported ${totalImported} products...`);
    } catch (error: any) {
      console.error('   ❌ Batch import error:', error.message);
      totalErrors += batch.length;
    }
    batch = [];
  };

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      step: async (results, parser) => {
        const row: any = results.data;
        totalParsed++;

        // ─── FILTER: Only import top-level visible products ───
        const isConfigurable = row.product_type === 'configurable';
        const visibility = (row.visibility || '').trim();
        const isVisible = visibility.includes('Catalog') || visibility === '4';
        const isStandaloneSimple = row.product_type === 'simple' && isVisible;

        if (!isConfigurable && !isStandaloneSimple) {
          const reason = !isVisible ? 'Not visible (child variant)' : `Unknown type: ${row.product_type}`;
          skipReasons[reason] = (skipReasons[reason] || 0) + 1;
          totalSkipped++;
          return;
        }

        try {
          // ─── PARSE ADDITIONAL ATTRIBUTES ───
          const attrs = parseAdditionalAttributes(row.additional_attributes || '');

          // ─── PRICE LOGIC ───
          let basePrice = safeParseFloat(row.price);
          let specialPrice: number | undefined = undefined;
          const rawSpecialPrice = safeParseFloat(row.special_price);

          // ─── VARIANTS (for configurable products) ───
          const variants: any[] = [];
          const childSkuList: string[] = [];

          if (isConfigurable && row.configurable_variations) {
            const variationEntries = row.configurable_variations.split('|');
            let lowestChildPrice = Infinity;
            let lowestChildSpecialPrice = Infinity;
            let totalChildQty = 0;
            let anyChildInStock = false;

            for (const variation of variationEntries) {
              // Parse: sku=CHILD-SKU,size=M,color=Black
              const pairs = variation.split(',');
              let childSku = '';
              const attributes = new Map<string, string>();

              for (const pair of pairs) {
                const eqIdx = pair.indexOf('=');
                if (eqIdx === -1) continue;
                const key = pair.substring(0, eqIdx).trim();
                const value = pair.substring(eqIdx + 1).trim();

                if (key === 'sku') {
                  childSku = value;
                } else if (key && value) {
                  attributes.set(key, value);
                }
              }

              if (!childSku) continue;
              childSkuList.push(childSku);

              // Look up child data from SKU index
              const childInfo = skuIndex.get(childSku);
              const childPrice = childInfo?.price || 0;
              const childSpecialPrice = childInfo?.specialPrice ?? null;
              const childStock = childInfo?.qty || 0;
              const childInStock = (childInfo?.isInStock || 0) > 0;

              // Track lowest prices
              if (childPrice > 0 && childPrice < lowestChildPrice) {
                lowestChildPrice = childPrice;
              }

              // Track lowest genuine special price
              const validChildSP = getValidSpecialPrice(childPrice, childSpecialPrice);
              if (validChildSP !== undefined && validChildSP < lowestChildSpecialPrice) {
                lowestChildSpecialPrice = validChildSP;
              }

              // Track stock
              totalChildQty += childStock;
              if (childInStock) anyChildInStock = true;

              variants.push({
                id: new mongoose.Types.ObjectId().toString(),
                sku: childSku,
                price: childPrice,
                specialPrice: validChildSP,
                stock: childStock,
                attributes,
                imageUrl: childInfo?.baseImage ? `https://store4riders.com/media/catalog/product${childInfo.baseImage}` : undefined,
              });
            }

            // ─── CONFIGURABLE PRICE DERIVATION ───
            // If parent has no price, use lowest child price
            if (basePrice === 0 && lowestChildPrice !== Infinity) {
              basePrice = lowestChildPrice;
            }

            // Special price for configurable = lowest genuine child discount
            if (lowestChildSpecialPrice !== Infinity) {
              specialPrice = lowestChildSpecialPrice;
            }

            // Stock for configurable = aggregated from children
            row._aggregatedQty = totalChildQty;
            row._aggregatedInStock = anyChildInStock ? 1 : 0;
          } else {
            // ─── SIMPLE PRODUCT PRICE ───
            specialPrice = getValidSpecialPrice(basePrice, rawSpecialPrice > 0 ? rawSpecialPrice : null);
          }

          // Safety: if basePrice is still 0, log warning and skip
          if (basePrice <= 0) {
            console.warn(`   ⚠️  SKU ${row.sku} has basePrice=0 after all derivation. Skipping.`);
            const reason = 'Zero price (missing children)';
            skipReasons[reason] = (skipReasons[reason] || 0) + 1;
            totalSkipped++;
            return;
          }

          // ─── BRAND ───
          const brand = extractBrand(attrs, row.name || '');

          // ─── GENDER ───
          const gender = extractGender(attrs);

          // ─── COUNTRY ───
          const countryOfManufacture = row.country_of_manufacture?.trim() || undefined;

          // ─── FREE SHIPPING ───
          const freeShipping = isFreeShipping(attrs);

          // ─── SIZE CHART ───
          const sizeChart = attrs.size_chart_01 || undefined;

          // ─── SLUG ───
          const baseSlug = generateSlug(row.url_key, row.name || row.sku);
          const slug = getUniqueSlug(baseSlug);

          // ─── IMAGES ───
          let images = extractImages(row);

          // For configurable products, merge child variant images into gallery
          if (isConfigurable && childSkuList.length > 0) {
            images = mergeChildImages(images, childSkuList);
          }

          // ─── DESCRIPTION (resolve Magento media URLs) ───
          const description = resolveDescriptionMediaUrls(
            row.description || row.short_description || 'No description available.'
          );
          const shortDescription = row.short_description?.trim() || undefined;

          // ─── STOCK STATUS & QTY ───
          let stockStatus: number;
          let qty: number;

          if (isConfigurable) {
            // For configurable: stock is aggregated from children
            stockStatus = row._aggregatedInStock ?? safeParseFloat(row.is_in_stock);
            qty = row._aggregatedQty ?? safeParseFloat(row.qty);
          } else {
            // For simple: directly from row
            stockStatus = safeParseFloat(row.is_in_stock);
            qty = safeParseFloat(row.qty);
          }

          // ─── RELATED / UPSELL / CROSSSELL SKUS ───
          const relatedSkus = splitSkus(row.related_skus);
          const upsellSkus = splitSkus(row.upsell_skus);
          const crosssellSkus = splitSkus(row.crosssell_skus);

          // ─── BUILD PRODUCT DOCUMENT ───
          const productDoc: Record<string, any> = {
            name: row.name || row.sku,
            description,
            slug,
            sku: row.sku,
            categoryId: undefined, // Will be mapped in category assignment phase
            basePrice,
            specialPrice,
            weight: safeParseFloat(row.weight),
            stockStatus,
            productType: row.product_type,
            magentoCategories: row.categories || undefined,
            configurableVariations: row.configurable_variations || undefined,
            configurableVariationLabels: row.configurable_variation_labels || undefined,
            shortDescription,
            metaTitle: row.meta_title?.trim() || undefined,
            metaKeywords: row.meta_keywords?.trim() || undefined,
            metaDescription: row.meta_description?.trim() || undefined,
            relatedSkus,
            upsellSkus,
            crosssellSkus,
            brand,
            gender,
            countryOfManufacture,
            attributeSetCode: row.attribute_set_code?.trim() || undefined,
            qty,
            sizeChart,
            size_chart: sizeChart, // Stored in both fields for compatibility
            isFreeShipping: freeShipping,
            images,
            variants,
            status: 'published', // All imported products are published
            isFeatured: false,
            tags: [],
            salesCount: 0,
            avgRating: 0,
            reviewCount: 0,
          };

          batch.push(productDoc);

          if (batch.length >= BATCH_SIZE) {
            parser.pause();
            processBatch()
              .then(() => parser.resume())
              .catch((err) => {
                console.error('   ❌ Batch process error', err);
                parser.resume();
              });
          }
        } catch (err: any) {
          console.error(`   ❌ Error processing SKU ${row.sku}:`, err.message);
          errorDetails.push({ sku: row.sku, error: err.message });
          totalErrors++;
        }
      },
      complete: async () => {
        // Flush remaining batch
        if (batch.length > 0) {
          await processBatch();
        }

        // ─── IMPORT SUMMARY ───
        console.log('\n' + '═'.repeat(60));
        console.log('  📊 IMPORT SUMMARY');
        console.log('═'.repeat(60));
        console.log(`  Total CSV Rows Parsed:     ${totalParsed}`);
        console.log(`  Products Imported:         ${totalImported}`);
        console.log(`  Rows Skipped:              ${totalSkipped}`);
        console.log(`  Errors:                    ${totalErrors}`);
        console.log('');
        console.log('  --- Skip Reasons ---');
        Object.entries(skipReasons).forEach(([reason, count]) => {
          console.log(`    ${reason}: ${count}`);
        });
        if (errorDetails.length > 0) {
          console.log('');
          console.log('  --- Error Details (first 10) ---');
          errorDetails.slice(0, 10).forEach((e) => {
            console.log(`    SKU ${e.sku}: ${e.error}`);
          });
        }
        console.log('═'.repeat(60));
        resolve();
      },
      error: (err: any) => reject(err),
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Post-Import Verification
// ──────────────────────────────────────────────────────────────

async function verifyImport(): Promise<void> {
  console.log('\n🔍 Post-Import Verification...\n');

  const totalProducts = await ProductModel.countDocuments();
  const configurableCount = await ProductModel.countDocuments({ productType: 'configurable' });
  const simpleCount = await ProductModel.countDocuments({ productType: 'simple' });
  const withVariants = await ProductModel.countDocuments({ 'variants.0': { $exists: true } });
  const withImages = await ProductModel.countDocuments({ 'images.0': { $exists: true } });
  const withRelated = await ProductModel.countDocuments({ 'relatedSkus.0': { $exists: true } });
  const withUpsell = await ProductModel.countDocuments({ 'upsellSkus.0': { $exists: true } });
  const withCrosssell = await ProductModel.countDocuments({ 'crosssellSkus.0': { $exists: true } });
  const withSpecialPrice = await ProductModel.countDocuments({ specialPrice: { $gt: 0 } });
  const withBrand = await ProductModel.countDocuments({ brand: { $exists: true, $ne: '' } });
  const withGender = await ProductModel.countDocuments({ gender: { $exists: true, $ne: null } });
  const freeShipCount = await ProductModel.countDocuments({ isFreeShipping: true });
  const zeroPriceCount = await ProductModel.countDocuments({ basePrice: { $lte: 0 } });
  const publishedCount = await ProductModel.countDocuments({ status: 'published' });
  const inStockCount = await ProductModel.countDocuments({ stockStatus: { $gt: 0 } });

  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │           DATABASE VERIFICATION             │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │ Total Products:           ${String(totalProducts).padStart(6)}          │`);
  console.log(`  │ Configurable:             ${String(configurableCount).padStart(6)}          │`);
  console.log(`  │ Simple (standalone):      ${String(simpleCount).padStart(6)}          │`);
  console.log(`  │ With Variants:            ${String(withVariants).padStart(6)}          │`);
  console.log(`  │ With Images:              ${String(withImages).padStart(6)}          │`);
  console.log(`  │ With Related SKUs:        ${String(withRelated).padStart(6)}          │`);
  console.log(`  │ With Upsell SKUs:         ${String(withUpsell).padStart(6)}          │`);
  console.log(`  │ With Crosssell SKUs:      ${String(withCrosssell).padStart(6)}          │`);
  console.log(`  │ With Special Price:       ${String(withSpecialPrice).padStart(6)}          │`);
  console.log(`  │ With Brand:               ${String(withBrand).padStart(6)}          │`);
  console.log(`  │ With Gender:              ${String(withGender).padStart(6)}          │`);
  console.log(`  │ Free Shipping:            ${String(freeShipCount).padStart(6)}          │`);
  console.log(`  │ Published:                ${String(publishedCount).padStart(6)}          │`);
  console.log(`  │ In Stock:                 ${String(inStockCount).padStart(6)}          │`);
  console.log(`  │ ⚠️  Zero/Negative Price:   ${String(zeroPriceCount).padStart(6)}          │`);
  console.log('  └─────────────────────────────────────────────┘');

  if (zeroPriceCount > 0) {
    console.log('\n  ⚠️  Products with zero price:');
    const zeroPrice = await ProductModel.find({ basePrice: { $lte: 0 } })
      .select('sku name productType')
      .lean()
      .exec();
    zeroPrice.slice(0, 10).forEach((p: any) => {
      console.log(`    - ${p.sku} (${p.productType}): ${p.name}`);
    });
    if (zeroPrice.length > 10) {
      console.log(`    ... and ${zeroPrice.length - 10} more`);
    }
  }

  // Sample: Show a configurable product with variants
  const sampleConfig = await ProductModel.findOne({
    productType: 'configurable',
    'variants.0': { $exists: true },
    basePrice: { $gt: 0 },
  })
    .select('sku name basePrice specialPrice variants images relatedSkus upsellSkus brand gender isFreeShipping stockStatus qty')
    .lean()
    .exec();

  if (sampleConfig) {
    console.log('\n  📋 Sample Configurable Product:');
    console.log(`    SKU: ${(sampleConfig as any).sku}`);
    console.log(`    Name: ${(sampleConfig as any).name}`);
    console.log(`    Brand: ${(sampleConfig as any).brand}`);
    console.log(`    Base Price: ₹${(sampleConfig as any).basePrice}`);
    console.log(`    Special Price: ${(sampleConfig as any).specialPrice ? '₹' + (sampleConfig as any).specialPrice : 'None'}`);
    console.log(`    Gender: ${(sampleConfig as any).gender || 'N/A'}`);
    console.log(`    Free Shipping: ${(sampleConfig as any).isFreeShipping}`);
    console.log(`    In Stock: ${(sampleConfig as any).stockStatus}`);
    console.log(`    Qty: ${(sampleConfig as any).qty}`);
    console.log(`    Variants: ${(sampleConfig as any).variants?.length || 0}`);
    console.log(`    Images: ${(sampleConfig as any).images?.length || 0}`);
    console.log(`    Related SKUs: ${(sampleConfig as any).relatedSkus?.length || 0}`);
    console.log(`    Upsell SKUs: ${(sampleConfig as any).upsellSkus?.length || 0}`);
    if ((sampleConfig as any).variants?.length > 0) {
      const v = (sampleConfig as any).variants[0];
      console.log(`    First Variant: SKU=${v.sku}, Price=₹${v.price}, SP=${v.specialPrice ? '₹' + v.specialPrice : 'None'}, Stock=${v.stock}`);
      console.log(`      Attributes: ${JSON.stringify(v.attributes || {})}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Main Entry Point
// ──────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Store4Riders — Robust Product Import Script   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`\n📁 CSV File: ${CSV_FILE_PATH}`);

  try {
    // Verify CSV exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
    }

    // Connect to database
    await connectToDatabase();

    // Drop existing products for a clean import
    console.log('\n🗑️  Dropping existing products collection for clean import...');
    try {
      await ProductModel.collection.drop();
      console.log('   ✅ Collection dropped.');
    } catch (err: any) {
      if (err.code === 26) {
        console.log('   ℹ️  Collection does not exist, skipping drop.');
      } else {
        console.error('   ⚠️  Error dropping collection:', err.message);
      }
    }

    // Pass 1: Build SKU index
    await buildSkuIndex();

    // Pass 2: Import products
    await processProducts();

    // Verify results
    await verifyImport();

    console.log('\n✅ Import completed successfully!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Import FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();
