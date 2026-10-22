import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB');

  const products = await db.collection('products').find({
    name: /Benelli.*Chain Sprocket|Rolon.*Benelli/i
  }).toArray();

  console.log(`Found ${products.length} matching products:`);
  for (const p of products) {
    console.log({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      attributesBrand: p.attributes?.brand || p.attributes?.Brand,
      categorySlugs: p.categorySlugs,
      magentoCategories: p.magentoCategories,
    });
  }

  // Also check all products in the same category
  console.log('\n--- Checking all products that have chain-sprocket or spares in categorySlugs ---');
  const catProducts = await db.collection('products').find({
    $or: [
      { categorySlugs: 'chain-sprocket-kits' },
      { categorySlugs: 'chain-sprockets' },
      { categorySlugs: 'chain-sprocket' },
      { name: /chain.*sprocket/i }
    ]
  }).toArray();

  console.log(`Total chain sprocket products: ${catProducts.length}`);
  const brandCounts: Record<string, number> = {};
  for (const cp of catProducts) {
    const b = cp.brand || cp.attributes?.brand || 'NO_BRAND';
    brandCounts[b] = (brandCounts[b] || 0) + 1;
  }
  console.log('Brand counts in chain sprockets:', brandCounts);

  await mongoose.disconnect();
}

run().catch(console.error);
