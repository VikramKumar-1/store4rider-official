/**
 * @file import-clan-products.ts
 * @description Imports Clan brand products from Clancsv1.csv into MongoDB.
 *
 * IMPORTANT: This script does NOT drop the existing products collection.
 * It upserts (insert or update) products by SKU, so it safely adds Clan products
 * alongside the existing catalog imported from the main CSV.
 *
 * Usage:
 *   npx tsx backup-data/import-clan-products.ts
 *
 * Prerequisites:
 *   - MONGODB_URI or DATABASE_URL env var set (or defaults to localhost)
 *   - backup-data/Clancsv1.csv must exist
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
// Mongoose Schema (mirrors backend/src/modules/product/product.model.ts)
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
    brand: { type: String },
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
        stock: { type: Number, required: true },
        attributes: { type: Map, of: String },
      },
    ],
  },
  { timestamps: true }
);

const ProductModel =
  mongoose.models.Product || mongoose.model('Product', productSchema);

// ──────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────
const CSV_FILE_PATH = path.join(__dirname, 'Clancsv1.csv');
const S3_BASE_URL = 'https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product';
const BATCH_SIZE = 50;

interface SkuInfo {
  price: number;
  qty: number;
}

// Map for quick lookup of child variant pricing/stock
const skuIndex = new Map<string, SkuInfo>();

// ──────────────────────────────────────────────────────────────
// Helpers (same as import-full-catalog.ts)
// ──────────────────────────────────────────────────────────────

function extractBrand(additionalAttributes: string, productName: string): string {
  if (!additionalAttributes) return productName.split(' ')[0];
  const regex = /brand="?([^",]+)"?/i;
  const match = additionalAttributes.match(regex);
  if (match && match[1]) return match[1];
  return productName.split(' ')[0];
}

function generateSlug(urlKey: string, name: string): string {
  return (urlKey || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractImages(row: any) {
  const images: any[] = [];
  const addedUrls = new Set<string>();

  const addImage = (imgPath: string, altText: string) => {
    if (!imgPath || typeof imgPath !== 'string') return;
    const cleanPath = imgPath.trim();
    if (!cleanPath) return;

    const relativePath = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    const fullUrl = `${S3_BASE_URL}${relativePath}`;

    if (!addedUrls.has(fullUrl)) {
      addedUrls.add(fullUrl);
      images.push({
        id: new mongoose.Types.ObjectId().toString(),
        url: fullUrl,
        altText: altText || '',
      });
    }
  };

  addImage(row.base_image, row.base_image_label);

  if (row.additional_images) {
    const additional = row.additional_images.split(',').map((s: string) => s.trim());
    const labels = row.additional_image_labels
      ? row.additional_image_labels.split(',').map((s: string) => s.trim())
      : [];

    additional.forEach((img: string, i: number) => {
      addImage(img, labels[i] || '');
    });
  }

  return images;
}

// ──────────────────────────────────────────────────────────────
// Pass 1: Build SKU index for variant price/stock lookup
// ──────────────────────────────────────────────────────────────
async function buildSkuIndex(): Promise<void> {
  console.log('Pass 1: Building SKU index from Clancsv1.csv...');
  return new Promise((resolve, reject) => {
    let count = 0;
    const fileStream = fs.createReadStream(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileStream, {
      header: true,
      skipEmptyLines: true,
      step: (results) => {
        const row: any = results.data;
        if (row.sku) {
          skuIndex.set(row.sku, {
            price: parseFloat(row.price || '0'),
            qty: parseFloat(row.qty || '0'),
          });
          count++;
        }
      },
      complete: () => {
        console.log(`Pass 1 complete. Indexed ${skuIndex.size} SKUs.`);
        resolve();
      },
      error: (err: any) => reject(err),
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Pass 2: Import configurable + visible simple products
// ──────────────────────────────────────────────────────────────
async function processProducts(): Promise<void> {
  console.log('Pass 2: Processing and importing Clan products...');

  let batch: any[] = [];
  let totalParsed = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Track slugs to avoid duplicates within this run
  const slugCounts = new Map<string, number>();

  const getUniqueSlug = (baseSlug: string) => {
    const count = slugCounts.get(baseSlug) || 0;
    slugCounts.set(baseSlug, count + 1);
    return count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;
  };

  const processBatch = async () => {
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
      console.log(`Imported ${totalImported} Clan products so far...`);
    } catch (error) {
      console.error('Batch import error:', error);
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

        // Only import top-level products (configurable parents or visible simples)
        const isConfigurable = row.product_type === 'configurable';
        const isStandaloneSimple =
          row.product_type === 'simple' &&
          (row.visibility?.includes('Catalog') || row.visibility === '4');

        if (!isConfigurable && !isStandaloneSimple) {
          totalSkipped++;
          return;
        }

        try {
          let basePrice = parseFloat(row.price) || 0;
          const specialPrice = row.special_price ? parseFloat(row.special_price) : undefined;

          // Extract variants from configurable_variations string
          const variants: any[] = [];
          if (isConfigurable && row.configurable_variations) {
            const variations = row.configurable_variations.split('|');
            let lowestPrice = Infinity;

            for (const variation of variations) {
              const pairs = variation.split(',');
              let childSku = '';
              const attributes = new Map<string, string>();

              for (const pair of pairs) {
                const [key, value] = pair.split('=');
                if (key === 'sku') {
                  childSku = value;
                } else if (key && value) {
                  attributes.set(key, value);
                }
              }

              if (childSku) {
                const childInfo = skuIndex.get(childSku);
                const price = childInfo?.price || 0;
                const stock = childInfo?.qty || 0;

                if (price > 0 && price < lowestPrice) {
                  lowestPrice = price;
                }

                variants.push({
                  id: new mongoose.Types.ObjectId().toString(),
                  sku: childSku,
                  price,
                  stock,
                  attributes,
                });
              }
            }

            // Use lowest child price if parent price is 0
            if (basePrice === 0 && lowestPrice !== Infinity) {
              basePrice = lowestPrice;
            }
          }

          const brand = extractBrand(row.additional_attributes, row.name || '');
          const baseSlug = generateSlug(row.url_key, row.name || row.sku);
          const slug = getUniqueSlug(baseSlug);
          const images = extractImages(row);

          const productDoc = {
            name: row.name || row.sku,
            description: row.description || row.short_description || 'No description available.',
            slug,
            sku: row.sku,
            categoryId: undefined,
            basePrice,
            specialPrice,
            weight: parseFloat(row.weight) || 0,
            stockStatus: parseFloat(row.is_in_stock) || 0,
            productType: row.product_type,
            magentoCategories: row.categories,
            configurableVariations: row.configurable_variations,
            shortDescription: row.short_description,
            metaTitle: row.meta_title,
            metaKeywords: row.meta_keywords,
            metaDescription: row.meta_description,
            relatedSkus: row.related_skus ? row.related_skus.split(',') : [],
            upsellSkus: row.upsell_skus ? row.upsell_skus.split(',') : [],
            brand,
            images,
            variants,
          };

          batch.push(productDoc);

          if (batch.length >= BATCH_SIZE) {
            parser.pause();
            processBatch()
              .then(() => parser.resume())
              .catch((err) => {
                console.error('Batch process error', err);
                parser.resume();
              });
          }
        } catch (err) {
          console.error(`Error processing sku ${row.sku}:`, err);
          totalErrors++;
        }
      },
      complete: async () => {
        // Flush remaining batch
        if (batch.length > 0) {
          await processBatch();
        }
        console.log('\n--- CLAN IMPORT SUMMARY ---');
        console.log(`Total Rows Parsed:  ${totalParsed}`);
        console.log(`Total Imported:     ${totalImported}`);
        console.log(`Total Skipped:      ${totalSkipped} (child variants — not standalone)`);
        console.log(`Total Errors:       ${totalErrors}`);
        resolve();
      },
      error: (err: any) => reject(err),
    });
  });
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function run() {
  try {
    // Verify CSV exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
    }
    console.log(`CSV file: ${CSV_FILE_PATH}`);

    // Connect to MongoDB (same DB as the running backend)
    const mongoUri =
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      'mongodb://localhost:27017/store4riders';
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Count existing products before import
    const beforeCount = await ProductModel.countDocuments();
    console.log(`Existing products in DB: ${beforeCount}`);

    // NOTE: We do NOT drop the collection — we only add/update Clan products
    await buildSkuIndex();
    await processProducts();

    const afterCount = await ProductModel.countDocuments();
    console.log(`\nProducts after import: ${afterCount} (added ${afterCount - beforeCount} new)`);
    console.log('Clan product import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

run();
