import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const p = await db.collection('products').findOne({ sku: 'SCL2ESKAI' });
  console.log('SCL2ESKAI categorySlugs:', p.categorySlugs);
  console.log('SCL2ESKAI magentoCategories:', p.magentoCategories);
  process.exit(0);
}
run().catch(console.error);
