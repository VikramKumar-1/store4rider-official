const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const count = await productsColl.countDocuments();
  console.log('Total Products in MongoDB:', count);

  const sample = await productsColl.find({ images: { $exists: true, $not: { $size: 0 } } }).limit(5).toArray();
  console.log('\nSample Products:');
  for (const p of sample) {
    console.log(`SKU: ${p.sku} | Name: ${p.name}`);
    console.log(` - Thumbnail: ${p.thumbnail}`);
    console.log(` - Images (first 2):`, (p.images || []).slice(0, 2).map(i => i.url));
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
