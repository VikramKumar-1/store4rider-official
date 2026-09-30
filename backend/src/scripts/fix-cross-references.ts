/**
 * @file fix-cross-references.ts
 * @description Fixes broken relatedSkus, upsellSkus, crosssellSkus references in MongoDB.
 *
 * PROBLEM: After variant migration, some child SKUs were deleted from DB.
 * But some products still have those deleted child SKUs in their
 * relatedSkus / upsellSkus / crosssellSkus arrays → returns empty results on frontend.
 *
 * SOLUTION:
 * 1. Build a complete "childSku → parentSku" lookup map from all products' variants[]
 * 2. For each product, scan relatedSkus / upsellSkus / crosssellSkus
 * 3. If a SKU no longer exists as a standalone product → replace with its parent SKU
 * 4. Remove any SKUs that can't be resolved at all
 *
 * USAGE:
 *   pnpm tsx backend/src/scripts/fix-cross-references.ts
 */

import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ─── Minimal Product Schema ───────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    sku: { type: String, index: true },
    name: String,
    slug: String,
    basePrice: Number,
    productType: String,
    relatedSkus: [String],
    upsellSkus: [String],
    crosssellSkus: [String],
    variants: [
      {
        id: String,
        sku: String,
        price: Number,
        stock: Number,
        attributes: { type: Map, of: String },
      },
    ],
  },
  { timestamps: true }
);

const ProductModel =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function fixCrossReferences() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not set in .env");

  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected.\n");

  // Step 1: Build childSku → parentSku map from ALL products' variants
  console.log("📦 Building child SKU → parent SKU lookup map...");
  const allProducts = await ProductModel.find(
    {},
    { sku: 1, variants: 1 }
  ).lean().exec() as any[];

  // Map: childSku → parentSku
  const childToParent = new Map<string, string>();
  // Set: all existing standalone SKUs in DB
  const existingSkus = new Set<string>();

  for (const product of allProducts) {
    existingSkus.add(product.sku);
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (variant.sku) {
          childToParent.set(variant.sku, product.sku);
        }
      }
    }
  }

  console.log(`✅ Found ${existingSkus.size} standalone products in DB`);
  console.log(`✅ Mapped ${childToParent.size} child variant SKUs → parent SKUs\n`);

  // Step 2: Find all products that have relatedSkus / upsellSkus / crosssellSkus
  const productsWithRefs = await ProductModel.find({
    $or: [
      { relatedSkus: { $exists: true, $ne: [] } },
      { upsellSkus: { $exists: true, $ne: [] } },
      { crosssellSkus: { $exists: true, $ne: [] } },
    ],
  }, {
    sku: 1,
    relatedSkus: 1,
    upsellSkus: 1,
    crosssellSkus: 1,
  }).lean().exec() as any[];

  console.log(`🔍 Found ${productsWithRefs.length} products with cross-references to fix.\n`);

  let fixedCount = 0;
  let skippedCount = 0;
  let totalRefsFixed = 0;
  let totalRefsRemoved = 0;

  // Step 3: For each product, fix broken references
  for (const product of productsWithRefs) {
    const updates: any = {};
    let hasChanges = false;

    const fixSkuArray = (skus: string[], fieldName: string): string[] => {
      const fixed: string[] = [];
      const seen = new Set<string>();

      for (const sku of skus) {
        const trimmed = sku.trim();
        if (!trimmed) continue;

        if (existingSkus.has(trimmed)) {
          // SKU exists as standalone product — keep it as-is
          if (!seen.has(trimmed)) {
            fixed.push(trimmed);
            seen.add(trimmed);
          }
        } else if (childToParent.has(trimmed)) {
          // SKU is a deleted child → replace with its parent SKU
          const parentSku = childToParent.get(trimmed)!;
          if (!seen.has(parentSku) && parentSku !== product.sku) {
            fixed.push(parentSku);
            seen.add(parentSku);
            console.log(
              `  🔄 [${product.sku}] ${fieldName}: "${trimmed}" → replaced with parent "${parentSku}"`
            );
            totalRefsFixed++;
          }
          hasChanges = true;
        } else {
          // SKU not found anywhere — KEEP IT as-is (do not delete)
          if (!seen.has(trimmed)) {
            fixed.push(trimmed);
            seen.add(trimmed);
          }
          console.log(
            `  ⚠️  [${product.sku}] ${fieldName}: "${trimmed}" → not found in DB (kept as-is)`
          );
        }
      }

      return fixed;
    };

    const fixedRelated = fixSkuArray(product.relatedSkus || [], "relatedSkus");
    const fixedUpsell = fixSkuArray(product.upsellSkus || [], "upsellSkus");
    const fixedCrosssell = fixSkuArray(product.crosssellSkus || [], "crosssellSkus");

    // Check if arrays changed
    if (
      JSON.stringify(fixedRelated) !== JSON.stringify(product.relatedSkus || []) ||
      JSON.stringify(fixedUpsell) !== JSON.stringify(product.upsellSkus || []) ||
      JSON.stringify(fixedCrosssell) !== JSON.stringify(product.crosssellSkus || [])
    ) {
      hasChanges = true;
    }

    if (hasChanges) {
      await ProductModel.updateOne(
        { sku: product.sku },
        {
          $set: {
            relatedSkus: fixedRelated,
            upsellSkus: fixedUpsell,
            crosssellSkus: fixedCrosssell,
          },
        }
      ).exec();
      fixedCount++;
    } else {
      skippedCount++;
    }
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════");
  console.log("      CROSS-REFERENCE FIX SUMMARY");
  console.log("═══════════════════════════════════════");
  console.log(`✅ Products updated       : ${fixedCount}`);
  console.log(`⏭️  Products already clean : ${skippedCount}`);
  console.log(`🔄 References fixed       : ${totalRefsFixed}`);
  console.log(`🗑️  References removed     : ${totalRefsRemoved}`);
  console.log("═══════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Done!");
}

fixCrossReferences().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
