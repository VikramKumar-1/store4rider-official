import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function auditGallery() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB');

  const productsColl = db.collection('products');

  const withColorImages = await productsColl.countDocuments({
    colorImages: { $exists: true, $ne: {} }
  });

  const withVariantImages = await productsColl.countDocuments({
    'variants.imageUrl': { $exists: true, $ne: null }
  });

  const withMultipleImages = await productsColl.countDocuments({
    'images.1': { $exists: true }
  });

  console.log(`══════════════════════════════════════════════════════`);
  console.log(` 3. GALLERY & VARIANT SWAP AUDIT`);
  console.log(`══════════════════════════════════════════════════════`);
  console.log(`- Products with multiple gallery images: ${withMultipleImages}`);
  console.log(`- Products with mapped colorImages:       ${withColorImages}`);
  console.log(`- Products with variant-specific imageUrl: ${withVariantImages}`);

  // Sample a configurable product with colorImages or variant images
  const sample = await productsColl.findOne({
    productType: 'configurable',
    'variants.1': { $exists: true },
    'images.1': { $exists: true }
  });

  if (sample) {
    console.log(`\nSample Configurable Product: [${sample.sku}] ${sample.name}`);
    console.log(`Gallery images count: ${sample.images?.length || 0}`);
    console.log(`ColorImages keys: ${sample.colorImages ? Object.keys(sample.colorImages) : 'None'}`);
    console.log(`Variants sample (first 3):`);
    sample.variants?.slice(0, 3).forEach((v: any) => {
      console.log(`  - SKU: ${v.sku}, Color: ${v.attributes?.color || v.attributes?.colour || 'N/A'}, ImageUrl: ${v.imageUrl || 'None'}`);
    });
  }

  await mongoose.disconnect();
}

auditGallery().catch(console.error);
