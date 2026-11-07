const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const p = await mongoose.connection.collection('products').findOne({
    name: /BOBO BM4 PRO/i
  });
  if (!p) {
    console.log('Not found by name, searching bobo...');
    const all = await mongoose.connection.collection('products').find({ name: /bobo/i }).limit(5).toArray();
    console.log(all.map(x => ({ name: x.name, sku: x.sku, slug: x.slug })));
    await mongoose.disconnect();
    return;
  }
  console.log('Product Found:');
  console.log('Name:', p.name);
  console.log('Slug:', p.slug);
  console.log('SKU:', p.sku);
  console.log('Thumbnail:', p.thumbnail);
  console.log('Images:', JSON.stringify(p.images, null, 2));
  console.log('Variants count:', p.variants ? p.variants.length : 0);
  if (p.variants && p.variants.length > 0) {
    console.log('Variant 0 images/thumbnail:', p.variants[0].thumbnail, p.variants[0].images);
  }
  await mongoose.disconnect();
}
check().catch(console.error);
