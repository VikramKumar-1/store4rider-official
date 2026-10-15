import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const products = await db.collection('products').find({
    $or: [
      { categorySlugs: { $regex: 'knee', $options: 'i' } },
      { name: { $regex: 'knee', $options: 'i' } },
      { sku: 'SHAICL2' }
    ]
  }).toArray();
  
  console.log('Total products found:', products.length);
  for (const p of products) {
    console.log('-----------------------------------------');
    console.log('SKU:', p.sku);
    console.log('Name:', p.name);
    console.log('categorySlugs:', p.categorySlugs);
    console.log('magentoCategories:', p.magentoCategories);
    console.log('attributes:', p.attributes);
    console.log('gender:', p.gender);
    console.log('color:', p.color);
    console.log('size:', p.size);
  }
  process.exit(0);
}
run().catch(console.error);
