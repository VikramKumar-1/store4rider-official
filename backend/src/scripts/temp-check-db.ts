import mongoose from 'mongoose';

async function checkDb() {
  await mongoose.connect('mongodb://127.0.0.1:27017/store4riders');
  const db = mongoose.connection.db;
  
  if (!db) {
    console.log("No DB connection");
    return;
  }

  const rynox = await db.collection('products').findOne({ slug: { $regex: 'rynox-h2go' } });
  console.log('--- RYNOX ---');
  if (rynox) {
    console.log(`Base Price: ${rynox.basePrice}`);
    console.log(`Special Price: ${rynox.specialPrice}`);
    console.log(`Variants count: ${rynox.variants ? rynox.variants.length : 0}`);
  }

  const zeros = await db.collection('products').find({ basePrice: 0, status: { $nin: ['draft', 'archived'] } }).limit(5).toArray();
  console.log('\n--- SAMPLE 0 PRICE PRODUCTS (PUBLISHED) ---');
  for (const z of zeros) {
    console.log(`Name: ${z.name}`);
    console.log(`SKU: ${z.sku}`);
    console.log(`Special: ${z.specialPrice}`);
    console.log(`Variants: ${z.variants ? z.variants.length : 0}`);
  }

  await mongoose.disconnect();
}

checkDb().catch(console.error);
