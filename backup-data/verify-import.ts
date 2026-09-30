/**
 * Verify that all referenced SKUs (related, upsell, crosssell) exist in the database.
 * This ensures "Complete Your Kit" and "You May Also Like" sections will work.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const productSchema = new mongoose.Schema({ sku: String, name: String, relatedSkus: [String], upsellSkus: [String], crosssellSkus: [String], productType: String, magentoCategories: String }, { strict: false });
const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);

async function verify() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error('No DB URI');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB\n');

  // Get all product SKUs in DB
  const allProducts = await ProductModel.find({}).select('sku name relatedSkus upsellSkus crosssellSkus productType magentoCategories').lean().exec();
  const existingSkus = new Set(allProducts.map((p: any) => p.sku));
  console.log(`Total products in DB: ${existingSkus.size}\n`);

  // Check categories
  const categories = new Map<string, number>();
  for (const p of allProducts as any[]) {
    if (p.magentoCategories) {
      // Parse "Default Category/Helmets/Full Face" → extract main category
      const parts = p.magentoCategories.split(',');
      for (const catPath of parts) {
        const segments = catPath.trim().split('/').filter(Boolean);
        // Skip "Default Category"
        const mainCat = segments.length > 1 ? segments[1] : segments[0];
        if (mainCat) {
          categories.set(mainCat, (categories.get(mainCat) || 0) + 1);
        }
      }
    }
  }

  console.log('=== CATEGORIES IN DB ===');
  const sorted = [...categories.entries()].sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    console.log(`  ${cat}: ${count} products`);
  }

  // Collect ALL referenced SKUs
  const missingRelated = new Set<string>();
  const missingUpsell = new Set<string>();
  const missingCrosssell = new Set<string>();
  let totalRelatedRefs = 0;
  let totalUpsellRefs = 0;
  let totalCrosssellRefs = 0;

  for (const p of allProducts as any[]) {
    if (p.relatedSkus?.length) {
      for (const sku of p.relatedSkus) {
        totalRelatedRefs++;
        if (!existingSkus.has(sku)) missingRelated.add(sku);
      }
    }
    if (p.upsellSkus?.length) {
      for (const sku of p.upsellSkus) {
        totalUpsellRefs++;
        if (!existingSkus.has(sku)) missingUpsell.add(sku);
      }
    }
    if (p.crosssellSkus?.length) {
      for (const sku of p.crosssellSkus) {
        totalCrosssellRefs++;
        if (!existingSkus.has(sku)) missingCrosssell.add(sku);
      }
    }
  }

  console.log('\n=== SKU REFERENCE VERIFICATION ===');
  console.log(`\nRelated SKUs (Complete Your Kit):`);
  console.log(`  Total references: ${totalRelatedRefs}`);
  console.log(`  Missing SKUs: ${missingRelated.size}`);
  if (missingRelated.size > 0) {
    console.log(`  Missing list: ${[...missingRelated].slice(0, 20).join(', ')}${missingRelated.size > 20 ? '...' : ''}`);
  }

  console.log(`\nUpsell SKUs (You May Also Like):`);
  console.log(`  Total references: ${totalUpsellRefs}`);
  console.log(`  Missing SKUs: ${missingUpsell.size}`);
  if (missingUpsell.size > 0) {
    console.log(`  Missing list: ${[...missingUpsell].slice(0, 20).join(', ')}${missingUpsell.size > 20 ? '...' : ''}`);
  }

  console.log(`\nCrosssell SKUs:`);
  console.log(`  Total references: ${totalCrosssellRefs}`);
  console.log(`  Missing SKUs: ${missingCrosssell.size}`);
  if (missingCrosssell.size > 0) {
    console.log(`  Missing list: ${[...missingCrosssell].slice(0, 20).join(', ')}${missingCrosssell.size > 20 ? '...' : ''}`);
  }

  // All unique missing
  const allMissing = new Set([...missingRelated, ...missingUpsell, ...missingCrosssell]);
  console.log(`\nTotal UNIQUE missing SKUs across all references: ${allMissing.size}`);

  await mongoose.disconnect();
  process.exit(0);
}

verify();
