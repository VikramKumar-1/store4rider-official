import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) return;

  const products = await db.collection('products').find({ description: { $regex: 'how to measure', $options: 'i' } }).limit(2).toArray();
  
  if (products.length > 0) {
    for (const p of products) {
      const html = p.description;
      const lines = html.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes('how to measure') || line.toLowerCase().includes('click here')) {
          console.log(`\nFound in SKU: ${p.sku}`);
          console.log(line.trim());
        }
      }
    }
  } else {
    console.log("Could not find that exact text in any product description.");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
