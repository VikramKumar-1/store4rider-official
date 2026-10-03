import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../backend/.env") });

import { ProductModel } from "../backend/src/modules/product/product.model";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/store4riders";
const CSV_PATH = path.join(__dirname, "Clancsv1.csv");

const FILTER_ATTRIBUTE_KEYS = [
  'helmet_type', 'material', 'riding_style', 'certification', 
  'gender', 'color'
];

/**
 * Parses Magento's additional_attributes string into key-value pairs.
 */
function parseAdditionalAttributes(attrString: string): Record<string, string> {
  if (!attrString) return {};
  
  const result: Record<string, string> = {};
  
  // Use regex to match key="value" or key=value, handling quotes properly
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

/**
 * Main script to backfill attributes
 */
async function backfillAttributes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log(`Reading CSV from ${CSV_PATH}...`);
    const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
    
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data as any[];
    console.log(`Parsed ${rows.length} rows from CSV.`);

    let updatedCount = 0;

    for (const row of rows) {
      if (!row.sku) continue;

      const attrs = parseAdditionalAttributes(row.additional_attributes || "");
      const productAttrs: Record<string, string> = {};
      
      for (const key of FILTER_ATTRIBUTE_KEYS) {
        if (attrs[key]) {
          // Clean up pipe-separated values like "Male"|"Female"
          const cleanValue = attrs[key].replace(/"\|"/g, ',').replace(/"/g, '').trim();
          productAttrs[key] = cleanValue;
        }
      }
      
      // Infer helmet_type from categories if not present
      if (!productAttrs.helmet_type && row.categories) {
        if (row.categories.includes('Full Face')) productAttrs.helmet_type = 'Full Face';
        else if (row.categories.includes('Modular')) productAttrs.helmet_type = 'Modular';
        else if (row.categories.includes('Open Face')) productAttrs.helmet_type = 'Open Face';
        else if (row.categories.includes('Off Road')) productAttrs.helmet_type = 'Off Road';
      }

      if (Object.keys(productAttrs).length > 0) {
        const result = await ProductModel.updateOne(
          { sku: row.sku },
          { $set: { attributes: productAttrs } }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
        }
      }
    }

    console.log(`Successfully updated attributes for ${updatedCount} products.`);
  } catch (error) {
    console.error("Error during backfill:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

backfillAttributes();
