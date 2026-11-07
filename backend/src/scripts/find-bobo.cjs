const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function findBobo() {
  await mongoose.connect(process.env.MONGODB_URI);
  const p = await mongoose.connection.db.collection('products').findOne({
    name: { $regex: 'BOBO BM4 Pro', $options: 'i' }
  });
  if (!p) {
    console.log('Not found by name, searching bobo...');
    const list = await mongoose.connection.db.collection('products').find({
      name: { $regex: 'BOBO', $options: 'i' }
    }).project({ sku: 1, name: 1, thumbnail: 1, images: 1 }).toArray();
    console.log(list);
    await mongoose.disconnect();
    return;
  }
  console.log('SKU:', p.sku);
  console.log('Name:', p.name);
  console.log('Thumbnail:', p.thumbnail);
  console.log('Images:', JSON.stringify(p.images, null, 2));
  await mongoose.disconnect();
}
findBobo().catch(console.error);
