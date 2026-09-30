import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) return;

  const sampleProd = await db.collection('products').findOne({ relatedSkus: { $exists: true, $not: { $size: 0 } } });
  
  if (sampleProd) {
    console.log(`Found product with relatedSkus: ${sampleProd.sku}`);
    console.log(`relatedSkus array:`, sampleProd.relatedSkus);
    console.log(`upsellSkus array:`, sampleProd.upsellSkus);
  } else {
    console.log("NO product found with any relatedSkus!");
  }

  // Also let's check a random product's raw magentoCategories to see if we parsed related_skus correctly from CSV
  // Actually, we can just run the CSV migration script's parsing logic briefly.

  await mongoose.disconnect();
}

run().catch(console.error);
