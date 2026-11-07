const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function checkDoubleWebp() {
  await mongoose.connect(process.env.MONGODB_URI);
  const count = await mongoose.connection.db.collection('products').countDocuments({
    thumbnail: { $regex: '\\.webp\\.webp' }
  });
  console.log('Total products with .webp.webp in thumbnail:', count);

  const sample = await mongoose.connection.db.collection('products').find({
    thumbnail: { $regex: '\\.webp\\.webp' }
  }).limit(5).toArray();

  sample.forEach(s => console.log(`SKU: ${s.sku} | Thumb: ${s.thumbnail}`));
  await mongoose.disconnect();
}

checkDoubleWebp().catch(console.error);
