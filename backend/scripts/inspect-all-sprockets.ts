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

  // Search all products with sprocket
  const sprocketProducts = await db.collection('products').find({
    $or: [
      { name: /sprocket/i },
      { magentoCategories: /sprocket/i },
      { categorySlugs: /sprocket/i }
    ]
  }).toArray();

  console.log(`Found ${sprocketProducts.length} total sprocket products across entire DB:`);
  for (const p of sprocketProducts) {
    console.log(`- [${p.sku}] brand="${p.brand}" stockStatus=${p.stockStatus} qty=${p.qty} allowBackorders=${p.allowBackorders} variantsStock=${p.variants?.map((v: any)=>v.stock)} name="${p.name}"`);
  }

  // Check what brands exist in the database with "benelli" or "lgr"
  const benelliProducts = await db.collection('products').find({
    $or: [
      { brand: /benelli/i },
      { brand: /lgr/i },
      { 'attributes.brand': /benelli|lgr/i }
    ]
  }).toArray();
  console.log(`\nProducts with brand containing Benelli or LGR: ${benelliProducts.length}`);

  // Let's also check all brands in the entire DB
  const allBrands = await db.collection('products').distinct('brand');
  console.log('\nAll distinct brands in DB:', allBrands.filter(b => b && b.trim()));

  await mongoose.disconnect();
}

run().catch(console.error);
