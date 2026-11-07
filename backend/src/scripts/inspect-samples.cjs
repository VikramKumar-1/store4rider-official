const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const prods = await mongoose.connection.db.collection('products')
    .find({ thumbnail: { $regex: '^https' } })
    .limit(10)
    .toArray();

  console.log(`Found ${prods.length} sample products with URLs:`);
  for (const p of prods) {
    console.log(`SKU: ${p.sku} | Name: "${p.name}"`);
    console.log(`  Thumbnail: ${p.thumbnail}`);
    console.log(`  Images[0]: ${p.images?.[0]?.url}`);
  }
  await mongoose.disconnect();
}

check().catch(console.error);
