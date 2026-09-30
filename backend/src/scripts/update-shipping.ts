import mongoose from "mongoose";
import fs from "fs";
import Papa from "papaparse";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), '.env') });

import { ProductModel } from "../modules/product/product.model";

const CSV_PATH = "C:/Users/vikur/Downloads/All product export csv-17.9.26.csv";

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB.");

  const fileContent = fs.readFileSync(CSV_PATH, "utf-8");
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const records = parsed.data as any[];

  console.log(`Loaded ${records.length} rows from CSV`);

  const updates: any[] = [];
  let freeCount = 0;
  let paidCount = 0;

  for (const row of records) {
    if (!row.sku || row.product_type !== "simple") continue;

    let isFreeShipping = false;
    const additionalAttrs = row.additional_attributes || "";

    // Look for ship_cost="0.000000"
    if (additionalAttrs.includes('ship_cost="0.000000"')) {
      isFreeShipping = true;
      freeCount++;
    } else if (additionalAttrs.includes('ship_cost="')) {
      paidCount++;
    }

    updates.push({
      updateOne: {
        filter: { sku: row.sku },
        update: { $set: { isFreeShipping } }
      }
    });
  }

  console.log(`Found ${freeCount} items with free shipping and ${paidCount} with paid shipping in CSV.`);
  console.log(`Applying updates...`);

  if (updates.length > 0) {
    const BATCH_SIZE = 500;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      await ProductModel.bulkWrite(batch);
      console.log(`Updated ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length}`);
    }
  }

  console.log("Done!");
  process.exit(0);
}

run().catch(console.error);
