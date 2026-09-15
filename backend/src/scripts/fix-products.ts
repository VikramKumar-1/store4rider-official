/**
 * fix-products.ts
 *
 * Full database sync script:
 * 1. Reads Clancsv1.csv and parses all 5 parent products with their COMPLETE image galleries.
 * 2. Maps every single image (base + additional) to flat S3 URLs (https://store4riders.s3.ap-south-2.amazonaws.com/<filename>).
 * 3. Assigns exact color labels (e.g. "Clan Scout - Blue", "Clan FRML - Brown", "Clan SNKR - Black/Red") to each image.
 * 4. Saves full image galleries to MongoDB so switching colors immediately displays the exact photo!
 *
 * Usage:
 *   cd backend
 *   npx tsx src/scripts/fix-products.ts
 */

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

import mongoose from "mongoose";
import Papa from "papaparse";
import { ProductModel } from "../modules/product/product.model";

const S3_REGION = process.env.S3_REGION || "ap-south-2";
const S3_BUCKET = process.env.S3_BUCKET || "store4riders";
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

function extractFilename(urlOrPath: string): string {
  if (!urlOrPath) return "";
  const parts = urlOrPath.split("/");
  return parts[parts.length - 1] || "";
}

function formatS3Url(rawPath: string): string {
  const filename = extractFilename(rawPath);
  return filename ? `${S3_BASE_URL}/${filename}` : "";
}

async function fixProducts() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in .env — cannot connect to database.");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected!\n");

  console.log(`S3 Base URL: ${S3_BASE_URL}\n`);

  // Read Clancsv1.csv
  const csvPath = path.resolve(process.cwd(), "../backup-data/Clancsv1.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  console.log("Reading and parsing CSV...");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });

  const parentSkuToImages: Record<string, Array<{ url: string; altText: string }>> = {};

  for (const row of parsed.data as any[]) {
    const sku = (row.sku || "").trim();
    const productType = (row.product_type || "").trim();
    const name = (row.name || sku).trim();

    // Only process configurable parent products
    if (productType === "configurable" || sku === "CL-SN-SE-WP" || sku === "CL-SN-SE" || sku === "CL-FR" || sku === "SCOUTWP" || sku === "SCOUTWP-D3O") {
      const images: Array<{ url: string; altText: string }> = [];

      // 1. Base Image
      if (row.base_image) {
        const url = formatS3Url(row.base_image);
        const label = (row.base_image_label || name).trim();
        if (url) images.push({ url, altText: label });
      }

      // 2. Additional Images with labels
      if (row.additional_images) {
        const extraImgs = row.additional_images.split(",");
        const extraLabels = (row.additional_image_labels || "").split(",");
        for (let i = 0; i < extraImgs.length; i++) {
          const rawImg = (extraImgs[i] || "").trim();
          const url = formatS3Url(rawImg);
          const label = (extraLabels[i] || "").trim() || `${name} - view ${i + 1}`;
          if (url && !images.some(img => img.url === url)) {
            images.push({ url, altText: label });
          }
        }
      }

      parentSkuToImages[sku] = images;
      console.log(`Parsed ${images.length} images for parent SKU [${sku}]: ${name}`);
    }
  }

  console.log("\n=== Updating MongoDB Products with Complete Galleries ===");

  const allDbProducts = await ProductModel.find({});
  let updatedCount = 0;

  for (const product of allDbProducts) {
    const sku = product.sku;
    const csvImages = parentSkuToImages[sku];

    if (csvImages && csvImages.length > 0) {
      product.set("images", csvImages);
      await product.save();
      console.log(`✅ Saved ${csvImages.length} images for ${product.name} (${sku})`);
      updatedCount++;
    } else {
      // Fallback: fix existing URLs
      const existing = (product as any).images || [];
      const fixed = existing.map((img: any) => ({
        ...img,
        url: formatS3Url(img.url),
      }));
      product.set("images", fixed);
      await product.save();
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} products with full color image galleries!`);

  console.log("\n=========================================");
  console.log("Fix Complete!");
  console.log("=========================================");

  await mongoose.disconnect();
  process.exit(0);
}

fixProducts().catch((err) => {
  console.error("Fix script failed:", err);
  process.exit(1);
});
