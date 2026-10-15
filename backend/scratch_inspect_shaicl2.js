import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const p = await db.collection('products').findOne({ sku: 'SHAICL2' });
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
}
run().catch(console.error);
