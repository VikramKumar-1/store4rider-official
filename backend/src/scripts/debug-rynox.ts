import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ESM if needed, but tsx usually handles it.
// To be safe, just point to .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') }); // Since ran from backend, ../.env might be right, or .env

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  if (!db) return;

  console.log("--- SEARCHING FOR RYNOX H2GO ---");
  const rynoxes = await db.collection('products').find({ name: { $regex: 'rynox h2go', $options: 'i' } }).toArray();
  console.log(`Found ${rynoxes.length} products`);
  
  for (const r of rynoxes) {
    console.log(`\nName: ${r.name}`);
    console.log(`SKU: ${r.sku}`);
    console.log(`Base Price: ${r.basePrice} | Special Price: ${r.specialPrice}`);
    console.log(`Status: ${r.status}`);
    console.log(`Variants: ${r.variants ? r.variants.length : 0}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
