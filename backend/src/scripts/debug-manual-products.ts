import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) return;

  const raidaJacket = await db.collection('products').findOne({ name: { $regex: 'Raida Vintago', $options: 'i' } });
  
  if (raidaJacket) {
    console.log(`Found: ${raidaJacket.name}`);
    console.log(`SKU: ${raidaJacket.sku}`);
    console.log(`Has images array?`, !!raidaJacket.images);
    console.log(`Images length:`, raidaJacket.images?.length);
    console.log(`Base Price:`, raidaJacket.basePrice);
  } else {
    console.log("Raida Vintago not found in DB.");
  }

  const axorMercury = await db.collection('products').findOne({ name: { $regex: 'Axor Mercury', $options: 'i' } });
  if (axorMercury) {
    console.log(`\nFound: ${axorMercury.name}`);
    console.log(`SKU: ${axorMercury.sku}`);
    console.log(`Has images array?`, !!axorMercury.images);
    console.log(`Images length:`, axorMercury.images?.length);
  } else {
    console.log("\nAxor Mercury not found in DB.");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
