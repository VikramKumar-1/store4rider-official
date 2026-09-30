/**
 * @file sync-cross-sell-from-csv.ts
 * @description Syncs relatedSkus, upsellSkus, crosssellSkus from Magento CSV to MongoDB.
 *
 * PROBLEM: The variant mapper script only updated basePrice, variants, status.
 * It did NOT update relatedSkus, upsellSkus, crosssellSkus.
 * So these fields are empty in DB → "Complete Your Kit" and "You May Also Like" show blank.
 *
 * SOLUTION: Read CSV and update ONLY these 3 fields for every product.
 * Does NOT touch variants, basePrice, images, or any other field.
 *
 * USAGE:
 *   # For main Magento CSV:
 *   pnpm tsx backend/src/scripts/sync-cross-sell-from-csv.ts "C:\Users\vikur\Downloads\All product export csv-17.9.26.csv"
 *
 *   # For Clan CSV:
 *   pnpm tsx backend/src/scripts/sync-cross-sell-from-csv.ts "C:\Users\vikur\Downloads\store4riders\backup-data\Clancsv1.csv"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Papa from "papaparse";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── Minimal Product Schema ───────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    sku: { type: String, index: true },
    relatedSkus: [String],
    upsellSkus: [String],
    crosssellSkus: [String],
  },
  { strict: false, timestamps: true }
);

const ProductModel =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

// ─── Parse comma-separated SKU string ────────────────────────────────────────
function parseSkuList(raw: string): string[] {
  if (!raw || raw.trim() === "") return [];
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function syncCrossSell(csvFilePath: string) {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env");

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected.\n");

  console.log(`📂 Reading CSV: ${csvFilePath}`);
  const csvContent = fs.readFileSync(csvFilePath, "utf-8");

  const { data: rows } = Papa.parse<any>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  console.log(`📊 Total rows: ${rows.length}\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  for (const row of rows) {
    const sku = row.sku?.trim();
    if (!sku) continue;

    // Only process rows that have at least one of these fields
    const relatedSkus = parseSkuList(row.related_skus || "");
    const upsellSkus = parseSkuList(row.upsell_skus || "");
    const crosssellSkus = parseSkuList(row.crosssell_skus || "");

    if (
      relatedSkus.length === 0 &&
      upsellSkus.length === 0 &&
      crosssellSkus.length === 0
    ) {
      skippedCount++;
      continue;
    }

    const result = await ProductModel.updateOne(
      { sku },
      {
        $set: {
          ...(relatedSkus.length > 0 && { relatedSkus }),
          ...(upsellSkus.length > 0 && { upsellSkus }),
          ...(crosssellSkus.length > 0 && { crosssellSkus }),
        },
      }
    ).exec();

    if (result.matchedCount === 0) {
      notFoundCount++;
    } else if (result.modifiedCount > 0) {
      console.log(
        `✅ [${sku}] relatedSkus(${relatedSkus.length}) upsellSkus(${upsellSkus.length}) crosssellSkus(${crosssellSkus.length})`
      );
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("       CROSS-SELL SYNC SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`✅ Updated   : ${updatedCount}`);
  console.log(`⏭️  Skipped   : ${skippedCount}`);
  console.log(`❓ Not found : ${notFoundCount}`);
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("🔌 Done!");
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error(
    "❌ Provide CSV path.\n" +
    "   Usage: pnpm tsx backend/src/scripts/sync-cross-sell-from-csv.ts \"<path-to-csv>\""
  );
  process.exit(1);
}

syncCrossSell(path.resolve(csvPath)).catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
