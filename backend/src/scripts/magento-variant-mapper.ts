/**
 * @file magento-variant-mapper.ts
 * @description One-time migration script to fix Magento configurable product → variant mapping.
 *
 * PROBLEM: Magento CSV exports configurable (parent) and simple (child/variant) products
 * as separate rows. During import, both were saved as separate DB documents.
 * This results in parent products showing ₹0 price and no size/color options.
 *
 * SOLUTION: This script:
 * 1. Reads the Magento CSV
 * 2. Identifies configurable parents via `product_type = configurable`
 * 3. Parses `configurable_variations` column to find child SKUs & attributes
 * 4. Fetches child prices from DB (or CSV itself)
 * 5. Embeds children as `variants[]` inside the parent document
 * 6. Sets parent `basePrice` = min child price
 * 7. Removes orphaned child documents from DB
 *
 * USAGE (from project root):
 *   pnpm tsx backend/src/scripts/magento-variant-mapper.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Papa from "papaparse";
import dotenv from "dotenv";

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── Inline Product Model (avoid circular imports in script context) ──────────
const productSchema = new mongoose.Schema(
  {
    name: String,
    slug: String,
    sku: { type: String, index: true },
    basePrice: Number,
    specialPrice: Number,
    stockStatus: Number,
    productType: String,
    configurableVariations: String,
    variants: [
      {
        id: String,
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        specialPrice: Number,
        stock: { type: Number, default: 0 },
        attributes: { type: Map, of: String },
      },
    ],
    status: String,
  },
  { timestamps: true }
);

const ProductModel =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

// ─── Types ────────────────────────────────────────────────────────────────────
interface MagentoRow {
  sku: string;
  product_type: string;
  price: string;
  special_price: string;
  is_in_stock: string;
  configurable_variations: string;
  configurable_variation_labels: string;
  name: string;
  [key: string]: string;
}

interface ParsedVariant {
  sku: string;
  attributes: Record<string, string>;
}

// ─── Parse `configurable_variations` column ───────────────────────────────────
/**
 * Parses Magento's configurable_variations string into an array of variant descriptors.
 *
 * Format: "sku=CHILD-SKU-1,color=Blue|sku=CHILD-SKU-2,color=Yellow"
 *
 * @param raw - Raw string from CSV column
 * @returns Array of { sku, attributes } objects
 */
function parseConfigurableVariations(raw: string): ParsedVariant[] {
  if (!raw || raw.trim() === "") return [];

  return raw
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const pairs = segment.split(",").map((p) => p.trim());
      const result: ParsedVariant = { sku: "", attributes: {} };

      for (const pair of pairs) {
        const eqIdx = pair.indexOf("=");
        if (eqIdx === -1) continue;
        const key = pair.substring(0, eqIdx).trim().toLowerCase();
        const val = pair.substring(eqIdx + 1).trim();

        if (key === "sku") {
          result.sku = val;
        } else {
          result.attributes[key] = val;
        }
      }

      return result;
    })
    .filter((v) => v.sku !== "");
}

// ─── Main Migration ───────────────────────────────────────────────────────────
async function runMigration(csvFilePath: string) {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected.\n");

  // Step 1: Read and parse CSV
  console.log(`📂 Reading CSV: ${csvFilePath}`);
  const csvContent = fs.readFileSync(csvFilePath, "utf-8");

  const { data: rows, errors } = Papa.parse<MagentoRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.warn(`⚠️  CSV parse warnings: ${errors.length}`);
  }

  console.log(`📊 Total rows parsed: ${rows.length}\n`);

  // Step 2: Build a lookup map of ALL rows by SKU (for price lookups)
  const rowBySku = new Map<string, MagentoRow>();
  for (const row of rows) {
    if (row.sku) {
      rowBySku.set(row.sku.trim(), row);
    }
  }

  // Step 3: Filter only configurable parents
  const configurableParents = rows.filter(
    (row) => row.product_type?.trim().toLowerCase() === "configurable"
  );

  console.log(`🔧 Found ${configurableParents.length} configurable products to process.\n`);

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const childSkusToDelete: string[] = [];

  // Step 4: Process each configurable parent
  for (const parent of configurableParents) {
    const parentSku = parent.sku.trim();

    try {
      // Parse variations from CSV column
      const parsedVariants = parseConfigurableVariations(
        parent.configurable_variations || ""
      );

      if (parsedVariants.length === 0) {
        console.warn(`⚠️  [${parentSku}] No configurable_variations found — skipping.`);
        skippedCount++;
        continue;
      }

      // Step 5: Build variants array from child rows
      const variants: any[] = [];
      const childPrices: number[] = [];

      for (const variant of parsedVariants) {
        const childSku = variant.sku;
        const childRow = rowBySku.get(childSku);

        if (!childRow) {
          console.warn(`  ⚠️  Child SKU "${childSku}" not found in CSV — checking DB...`);

          // Fallback: check DB directly
          const dbChild = await ProductModel.findOne({ sku: childSku }).lean().exec() as any;
          if (dbChild && dbChild.basePrice > 0) {
            variants.push({
              id: `var-${childSku}`,
              sku: childSku,
              price: dbChild.basePrice,
              specialPrice: dbChild.specialPrice || undefined,
              stock: dbChild.qty || 10,
              attributes: new Map(Object.entries(variant.attributes)),
            });
            childPrices.push(dbChild.basePrice);
            childSkusToDelete.push(childSku);
          } else {
            console.warn(`  ❌ Child SKU "${childSku}" not found in DB either — skipping variant.`);
          }
          continue;
        }

        const price = parseFloat(childRow.price) || 0;
        const specialPrice = parseFloat(childRow.special_price) || undefined;
        const stock = parseFloat(childRow.is_in_stock) || 0;

        if (price === 0) {
          console.warn(`  ⚠️  Child SKU "${childSku}" has price=0 — skipping variant.`);
          continue;
        }

        variants.push({
          id: `var-${childSku}`,
          sku: childSku,
          price,
          specialPrice: specialPrice || undefined,
          stock: stock > 0 ? stock : 10,
          attributes: new Map(Object.entries(variant.attributes)),
        });

        childPrices.push(price);
        childSkusToDelete.push(childSku);
      }

      if (variants.length === 0) {
        console.warn(`⚠️  [${parentSku}] No valid variants built — skipping parent update.`);
        skippedCount++;
        continue;
      }

      // Step 6: Calculate parent basePrice = min child price
      const basePrice = Math.min(...childPrices);

      // Step 7: Update parent in DB
      const updatedParent = await ProductModel.findOneAndUpdate(
        { sku: parentSku },
        {
          $set: {
            basePrice,
            productType: "configurable",
            variants,
            status: "published",
          },
        },
        { new: true }
      ).lean().exec();

      if (!updatedParent) {
        console.warn(`⚠️  [${parentSku}] Parent not found in DB — skipping.`);
        skippedCount++;
        continue;
      }

      console.log(
        `✅ [${parentSku}] → Updated with ${variants.length} variants. basePrice set to ₹${basePrice}`
      );
      successCount++;
    } catch (err: any) {
      console.error(`❌ [${parentSku}] Error: ${err.message}`);
      errorCount++;
    }
  }

  // Step 8: Delete orphaned child simple products from DB
  console.log(`\n🗑️  Removing ${childSkusToDelete.length} orphaned child products from DB...`);

  if (childSkusToDelete.length > 0) {
    const deleteResult = await ProductModel.deleteMany({
      sku: { $in: childSkusToDelete },
    }).exec();

    console.log(`✅ Deleted ${deleteResult.deletedCount} child documents from DB.`);
  }

  // Step 9: Summary
  console.log("\n═══════════════════════════════════════");
  console.log("         MIGRATION SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`✅ Successfully updated : ${successCount}`);
  console.log(`⚠️  Skipped             : ${skippedCount}`);
  console.log(`❌ Errors               : ${errorCount}`);
  console.log(`🗑️  Child docs deleted  : ${childSkusToDelete.length}`);
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB. Migration complete.");
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
const csvPath = process.argv[2];

if (!csvPath) {
  console.error(
    "❌ Please provide the CSV file path as an argument.\n" +
    "   Usage: pnpm tsx backend/src/scripts/magento-variant-mapper.ts \"C:/Users/vikur/Downloads/All product export csv-17.9.26.csv\""
  );
  process.exit(1);
}

runMigration(path.resolve(csvPath)).catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
