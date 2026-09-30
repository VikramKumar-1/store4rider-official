import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  if (!db) return;

  const jacket = await db.collection('products').findOne({ sku: 'RH2GORJ' });
  if (jacket) {
    console.log(`Parent Name: ${jacket.name}`);
    console.log(`Base Price: ${jacket.basePrice}`);
    console.log(`Variants:`);
    console.log(JSON.stringify(jacket.variants, null, 2));
  } else {
    console.log("Jacket not found!");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
