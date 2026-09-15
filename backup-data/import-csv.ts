/**
 * CSV Product Import Script for Store4Riders
 * 
 * Maps Magento CSV columns → MongoDB schema (product.model.ts) correctly.
 * Uses direct Mongoose connection (NOT Payload CMS).
 * 
 * Usage:
 *   cd store4riders
 *   npx ts-node backup-data/import-csv.ts --file backup-data/Clancsv1.csv
 * 
 * What it does:
 *   1. Reads CSV (comma or tab delimited)
 *   2. Maps every column to the correct MongoDB field
 *   3. Converts base_image + additional_images → images[] array with S3 URLs
 *   4. Handles configurable (parent) + simple (child) products
 *   5. Extracts related_skus and upsell_skus
 *   6. Auto-generates slug from url_key or name
 *   7. Skips duplicates by SKU
 */

import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

// -----------------------------------------------------------
// 1. MongoDB Connection (same as backend/.env)
// -----------------------------------------------------------
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "";

// -----------------------------------------------------------
// 2. Product Schema (mirrors backend/src/modules/product/product.model.ts)
// -----------------------------------------------------------
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
  mongoose.models.Product || mongoose.model("Product", productSchema);

// -----------------------------------------------------------
// 3. S3 Base URL for product images
// -----------------------------------------------------------
const S3_BASE = "https://store4riders.s3.ap-south-2.amazonaws.com";

// -----------------------------------------------------------
// 4. Helper: Convert Magento image path to S3 URL
//    e.g. "/f/r/frml-1-_5_.jpg" → "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/f/r/frml-1-_5_.jpg"
// -----------------------------------------------------------
function magentoImageToS3Url(imagePath: string): string {
  if (!imagePath || imagePath.trim() === "") return "";
  const clean = imagePath.trim().replace(/^\//, "");
  return `${S3_BASE}/catalog/product/${clean}`;
}

// -----------------------------------------------------------
// 5. Helper: Slugify (same as @store4riders/shared-utils)
// -----------------------------------------------------------
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// -----------------------------------------------------------
// 6. Helper: Parse comma-separated SKU strings into arrays
//    e.g. "RCPRBG,TRARG,TURG" → ["RCPRBG", "TRARG", "TURG"]
// -----------------------------------------------------------
function parseSkuList(skuStr: string): string[] {
  if (!skuStr || skuStr.trim() === "") return [];
  return skuStr.split(",").map((s) => s.trim()).filter(Boolean);
}

// -----------------------------------------------------------
// 7. Main CSV → MongoDB mapping function
// -----------------------------------------------------------
interface CSVRow {
  [key: string]: string;
}

function mapCsvRowToProduct(row: CSVRow, allRows: CSVRow[]) {
  const name = (row.name || row.sku || "").trim();
  if (!name) return null;

  const sku = (row.sku || "").trim();
  if (!sku) return null;

  // --- Price ---
  let basePrice = parseFloat(row.price || "0");

  // For configurable products with price 0, find child's price
  if (row.product_type === "configurable" && basePrice === 0) {
    const child = allRows.find(
      (r) => r.product_type === "simple" && r.sku && r.sku.startsWith(sku)
    );
    if (child) {
      basePrice = parseFloat(child.price || "0");
    }
  }

  const specialPrice = row.special_price
    ? parseFloat(row.special_price)
    : undefined;

  // --- Slug ---
  const slug = row.url_key ? slugify(row.url_key) : slugify(name);

  // --- Images (base_image + additional_images → images[] array) ---
  const images: Array<{ url: string; altText: string }> = [];

  // Add base_image as first/primary image
  if (row.base_image && row.base_image.trim()) {
    const url = magentoImageToS3Url(row.base_image);
    if (url) {
      images.push({
        url,
        altText: (row.base_image_label || name).trim(),
      });
    }
  }

  // Add additional_images (comma-separated paths)
  if (row.additional_images && row.additional_images.trim()) {
    const additionalPaths = row.additional_images.split(",");
    const additionalLabels = (row.additional_image_labels || "")
      .split(",")
      .map((l: string) => l.trim());

    additionalPaths.forEach((imgPath: string, idx: number) => {
      const url = magentoImageToS3Url(imgPath);
      if (url) {
        // Avoid duplicate of base_image
        if (!images.some((img) => img.url === url)) {
          images.push({
            url,
            altText: additionalLabels[idx] || name,
          });
        }
      }
    });
  }

  // --- Related & Upsell SKUs ---
  const relatedSkus = parseSkuList(row.related_skus || "");
  const upsellSkus = parseSkuList(row.upsell_skus || "");

  // --- Description (multi-line HTML from CSV) ---
  const description = (row.description || "").trim();
  const shortDescription = (row.short_description || "").trim();

  // --- Build product document ---
  return {
    name,
    sku,
    slug,
    description: description || "No description available.",
    shortDescription: shortDescription || undefined,
    basePrice,
    specialPrice: specialPrice || undefined,
    weight: row.weight ? parseFloat(row.weight) : undefined,
    stockStatus: row.is_in_stock === "0" ? 0 : 1,
    productType: row.product_type || "simple",
    magentoCategories: (row.categories || "").trim(),
    configurableVariations: (row.configurable_variations || "").trim() || undefined,
    metaTitle: (row.meta_title || "").trim() || undefined,
    metaKeywords: (row.meta_keywords || "").trim() || undefined,
    metaDescription: (row.meta_description || "").trim() || undefined,
    relatedSkus: relatedSkus.length > 0 ? relatedSkus : undefined,
    upsellSkus: upsellSkus.length > 0 ? upsellSkus : undefined,
    images,
  };
}

// -----------------------------------------------------------
// 8. Main runner
// -----------------------------------------------------------
async function run() {
  // Parse CLI args
  const fileArg = process.argv.find((a) => a.startsWith("--file="));
  const csvPath = fileArg
    ? fileArg.split("=")[1]
    : path.join(__dirname, "Clancsv1.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    process.exit(1);
  }

  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set. Create a .env file or set the environment variable.");
    process.exit(1);
  }

  // Connect to MongoDB
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Read & parse CSV
  console.log(`📄 Reading CSV: ${csvPath}`);
  const fileContent = fs.readFileSync(csvPath, "utf8");

  // Auto-detect delimiter (tab or comma)
  const firstLine = fileContent.split("\n")[0];
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  });

  const allRows = parsed.data as CSVRow[];
  console.log(`📊 Parsed ${allRows.length} rows`);

  // Filter: Only import "configurable" products (parents) and standalone "simple" products
  // Skip child simple products that belong to a configurable parent
  const configurableSkus = new Set(
    allRows
      .filter((r) => r.product_type === "configurable")
      .map((r) => r.sku)
  );

  const productsToImport = allRows.filter((row) => {
    if (row.product_type === "configurable") return true;
    // Simple product: only import if it's NOT a child of a configurable
    if (row.product_type === "simple") {
      const isChild = Array.from(configurableSkus).some((parentSku) =>
        row.sku?.startsWith(parentSku)
      );
      // Import standalone simple products only (not children)
      return !isChild;
    }
    return true;
  });

  console.log(`🎯 ${productsToImport.length} products to import (skipping ${allRows.length - productsToImport.length} child variants)`);

  // Import in batches
  const BATCH_SIZE = 20;
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < productsToImport.length; i += BATCH_SIZE) {
    const batch = productsToImport.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (row) => {
        try {
          const productData = mapCsvRowToProduct(row, allRows);
          if (!productData) {
            skipped++;
            return;
          }

          // Check if product already exists by SKU
          const existing = await ProductModel.findOne({ sku: productData.sku });

          if (existing) {
            // Update existing product
            await ProductModel.updateOne(
              { sku: productData.sku },
              { $set: productData }
            );
            updated++;
          } else {
            // Create new product
            await ProductModel.create(productData);
            created++;
          }
        } catch (err: any) {
          // Handle duplicate slug errors gracefully
          if (err.code === 11000) {
            skipped++;
          } else {
            errors++;
            console.error(`  ❌ Error [${row.sku}]: ${err.message}`);
          }
        }
      })
    );

    const progress = Math.min(i + BATCH_SIZE, productsToImport.length);
    console.log(
      `  Progress: ${progress}/${productsToImport.length} | Created: ${created} | Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`
    );
  }

  console.log("\n========================================");
  console.log("✅ Import Complete!");
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors:  ${errors}`);
  console.log("========================================");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
