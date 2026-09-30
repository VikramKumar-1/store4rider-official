import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) return;

  const smkHelmet = await db.collection('products').findOne({ name: { $regex: 'SMK Agnar Solid', $options: 'i' } });
  
  if (smkHelmet) {
    console.log(`\n--- FOUND IN DB ---`);
    console.log(`Name: ${smkHelmet.name}`);
    console.log(`SKU: ${smkHelmet.sku}`);
    console.log(`Status: ${smkHelmet.status}`);
    console.log(`Base Price: ${smkHelmet.basePrice}`);
    console.log(`Stock Status: ${smkHelmet.stockStatus}`);
    console.log(`Has Images?:`, !!smkHelmet.images && smkHelmet.images.length > 0);
  } else {
    console.log("\n--- NOT FOUND IN DB AT ALL ---");
    console.log("SMK Agnar Solid Gloss Helmet is missing from the MongoDB database.");
    console.log("This means it was NEVER imported from the CSV.");
  }

  // Also check total products in DB
  const total = await db.collection('products').countDocuments();
  console.log(`\nTotal products currently in MongoDB: ${total}`);

  await mongoose.disconnect();
}

run().catch(console.error);
