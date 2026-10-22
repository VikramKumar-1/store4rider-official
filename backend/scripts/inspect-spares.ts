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

  const cat = await db.collection('categories').findOne({
    slug: { $in: ['chain-sprocket-kits', 'bike-spare-parts-online', 'spares'] }
  });
  console.log('Category doc:', cat);

  // Check all products under Spares / Bike Spare Parts Online to see what brands exist
  const sparesProducts = await db.collection('products').find({
    categorySlugs: { $in: ['bike-spare-parts-online', 'spares'] }
  }).toArray();
  console.log(`Total spares products in DB: ${sparesProducts.length}`);
  const brands = new Set();
  sparesProducts.forEach(p => {
    brands.add(p.brand || p.attributes?.brand || 'NO_BRAND');
  });
  console.log('Brands in spares:', Array.from(brands));

  await mongoose.disconnect();
}

run().catch(console.error);
