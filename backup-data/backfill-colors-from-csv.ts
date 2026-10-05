/**
 * @file backfill-colors-from-csv.ts
 * @description Reads "Edited product csv of all brands.csv" and backfills
 *   attributes.color (and other filter attributes) into MongoDB products.
 *
 * The original backfill-attributes.ts pointed at Clancsv1.csv which no longer
 * exists, so this script runs against the real CSV to populate missing color
 * data that the aggregation and filter logic now rely on.
 *
 * Usage:  npx tsx backup-data/backfill-colors-from-csv.ts
 */

import fs from "fs";
import path from "path";
import Papa from "papaparse";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../backend/.env") });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/store4riders";

const CSV_PATH = "C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv";

const FILTER_ATTRIBUTE_KEYS = [
  "helmet_type",
  "material",
  "riding_style",
  "certification",
  "gender",
  "color",
];

/**
 * Parses Magento additional_attributes like:
 *   color="Black",condition="New",brand="SMK Helmets",ship_cost="150.000000"
 */
function parseAdditionalAttributes(
  attrString: string
): Record<string, string> {
  if (!attrString) return {};
  const result: Record<string, string> = {};

  const regex = /([^=,]+)="([^"]*)"|([^=,]+)=([^,]*)/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    const key = (match[1] || match[3])?.trim();
    const value = (match[2] || match[4])?.trim();
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  // Use a loose schema so we can read and write any field
  const Product =
    mongoose.models.Product ||
    mongoose.model(
      "Product",
      new mongoose.Schema({}, { strict: false, collection: "products" })
    );

  console.log(`Reading CSV: ${CSV_PATH}`);
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = parsed.data as any[];
  console.log(`Parsed ${rows.length} rows.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.sku) continue;

    const attrs = parseAdditionalAttributes(row.additional_attributes || "");

    // Build the $set payload — only include keys that have values
    const setPayload: Record<string, string> = {};
    for (const key of FILTER_ATTRIBUTE_KEYS) {
      if (attrs[key]) {
        // Clean pipe-separated quoted values: "Male"|"Female" → Male,Female
        const clean = attrs[key]
          .replace(/"\|"/g, ",")
          .replace(/"/g, "")
          .trim();
        setPayload[`attributes.${key}`] = clean;
      }
    }

    // Infer helmet_type from categories when not in additional_attributes
    if (!setPayload["attributes.helmet_type"] && row.categories) {
      if (row.categories.includes("Full Face"))
        setPayload["attributes.helmet_type"] = "Full Face";
      else if (row.categories.includes("Modular"))
        setPayload["attributes.helmet_type"] = "Modular";
      else if (row.categories.includes("Open Face"))
        setPayload["attributes.helmet_type"] = "Open Face";
      else if (row.categories.includes("Off Road"))
        setPayload["attributes.helmet_type"] = "Off Road";
      else if (row.categories.includes("Half Face"))
        setPayload["attributes.helmet_type"] = "Half Face";
    }

    if (Object.keys(setPayload).length === 0) {
      skippedCount++;
      continue;
    }

    const result = await Product.updateOne(
      { sku: row.sku },
      { $set: setPayload }
    );

    if (result.matchedCount === 0) {
      notFoundCount++;
    } else if (result.modifiedCount > 0) {
      updatedCount++;
    }

    // Progress log every 200 rows
    if ((i + 1) % 200 === 0) {
      console.log(
        `  Progress: ${i + 1}/${rows.length} | Updated: ${updatedCount} | Skipped: ${skippedCount} | Not found: ${notFoundCount}`
      );
    }
  }

  console.log("\n=== DONE ===");
  console.log(`Total rows:    ${rows.length}`);
  console.log(`Updated:       ${updatedCount}`);
  console.log(`Skipped (no attrs): ${skippedCount}`);
  console.log(`SKU not in DB: ${notFoundCount}`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
