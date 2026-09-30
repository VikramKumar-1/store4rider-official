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
  console.log('--- RYNOX JACKET PARENT ---');
  console.log(`Base: ${jacket?.basePrice} | Special: ${jacket?.specialPrice}`);
  console.log(`Meta Title: ${jacket?.metaTitle}`);

  const child = await db.collection('products').findOne({ sku: 'H2GO_PRO3_RAIN_JKT_BLK_S' });
  console.log('\n--- RYNOX JACKET CHILD ---');
  if (child) {
    console.log(`Found! Base: ${child.basePrice} | Special: ${child.specialPrice}`);
  } else {
    console.log(`Child NOT FOUND in database!`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
