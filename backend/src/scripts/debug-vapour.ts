import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) return;

  const product = await db.collection('products').findOne({ name: { $regex: 'Rynox Vapour Pro Performance Base Layer - Upper', $options: 'i' } });
  
  if (product) {
    console.log(`\n--- ${product.name} ---`);
    console.log(`SKU: ${product.sku}`);
    console.log(`Base Price: ${product.basePrice}`);
    console.log(`Special Price: ${product.specialPrice}`);
    console.log(`Variants count: ${product.variants ? product.variants.length : 0}`);
    if (product.variants && product.variants.length > 0) {
      console.log('First 3 Variants:');
      console.log(JSON.stringify(product.variants.slice(0, 3), null, 2));
    }
  } else {
    console.log("Not found!");
  }

  // Also check Rynox Jacket just in case
  const jacket = await db.collection('products').findOne({ sku: 'RH2GORJ' });
  if (jacket && jacket.variants) {
    console.log(`\n--- RYNOX JACKET FIRST VARIANT ---`);
    console.log(JSON.stringify(jacket.variants[0], null, 2));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
