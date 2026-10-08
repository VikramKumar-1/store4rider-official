/**
 * fix-variant-images.mjs
 *
 * One-time script to fix colorImages mappings and fill missing variant imageUrls
 * by matching manufacturer color codes (e.g. GL216 → _ma216_) in product image URLs.
 *
 * Run: node fix-variant-images.mjs
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Load env from backend/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "backend/.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ No DATABASE_URL found in .env");
  process.exit(1);
}

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

const KNOWN_SIZES = new Set(["xs", "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "2xl", "3xl", "4xl"]);

/**
 * Given a variant SKU like "GL186-XS-Green", extract the manufacturer color code "gl186"
 */
function extractColorCode(sku) {
  if (!sku) return null;
  const parts = sku.split(/[-_]/);
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (KNOWN_SIZES.has(lower)) continue;
    if (part.length < 3) continue;
    if (/^[a-z]+$/i.test(part)) continue; // Skip pure color words
    return lower; // This is a manufacturer code like gl186, ma216
  }
  return null;
}

/**
 * Given a color code (like "gl216"), find an image URL that contains it
 */
function findImageByCode(images, code) {
  return images.find((img) => img.url && img.url.toLowerCase().includes(code))?.url || null;
}

async function run() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected\n");

  // Fetch all configurable products with variants and images
  const products = await Product.find({
    productType: "configurable",
    "images.0": { $exists: true },
  })
    .select("name sku slug variants images colorImages")
    .lean();

  console.log(`📦 Found ${products.length} configurable products to check\n`);

  let totalFixed = 0;
  let totalProducts = 0;

  for (const product of products) {
    if (!product.variants || product.variants.length === 0) continue;
    if (!product.images || product.images.length === 0) continue;

    const updates = {};
    const codeToUrl = new Map();

    // Build code → imageUrl map from product images
    for (const img of product.images) {
      const urlLower = img.url?.toLowerCase() || "";
      // Extract code from image filename (e.g. _gl186_ → gl186)
      const match = urlLower.match(/_([a-z]{2}\d{3})_/);
      if (match) {
        codeToUrl.set(match[1], img.url);
      }
    }

    let productHadFixes = false;

    // Fix each variant missing imageUrl
    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];
      if (variant.imageUrl) continue; // Already has image

      const code = extractColorCode(variant.sku);
      if (!code) continue;

      // Try direct match
      let imageUrl = codeToUrl.get(code) || findImageByCode(product.images, code);

      if (imageUrl) {
        updates[`variants.${i}.imageUrl`] = imageUrl;
        productHadFixes = true;
        totalFixed++;
        console.log(`  ✅ ${product.slug} | ${variant.sku} → ${code} → ${imageUrl.split("/").pop()}`);
      }
    }

    // Fix colorImages that are pointing to wrong images
    // If a colorImages entry points to an image that doesn't match its color code,
    // try to find a better one using the variant SKU codes
    if (product.colorImages) {
      const colorMap = product.colorImages instanceof Map
        ? Object.fromEntries(product.colorImages)
        : product.colorImages;

      for (const [colorName, currentUrl] of Object.entries(colorMap)) {
        // Find the variant for this color to get its SKU code
        const matchingVariant = product.variants.find((v) => {
          const vColor = v.attributes?.color || v.attributes?.colour || "";
          return vColor.toLowerCase() === colorName.toLowerCase();
        });

        if (!matchingVariant) continue;

        const code = extractColorCode(matchingVariant.sku);
        if (!code) continue;

        const correctUrl = codeToUrl.get(code) || findImageByCode(product.images, code);
        if (correctUrl && correctUrl !== currentUrl) {
          updates[`colorImages.${colorName}`] = correctUrl;
          productHadFixes = true;
          console.log(`  🔄 ${product.slug} | colorImages[${colorName}]: ${currentUrl.split("/").pop()} → ${correctUrl.split("/").pop()}`);
        }
      }
    }

    if (productHadFixes) {
      await Product.updateOne({ _id: product._id }, { $set: updates });
      totalProducts++;
    }
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Done! Fixed ${totalFixed} variants across ${totalProducts} products.`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
