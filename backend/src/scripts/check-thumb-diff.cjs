const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function checkThumbnailVsImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  const prods = await mongoose.connection.db.collection('products').find({}).toArray();

  let count = 0;
  for (const p of prods) {
    const hasValidGallery = Array.isArray(p.images) && p.images.some(img => img?.url && !img.url.includes('no-image'));
    const thumbBrokenOrMissing = !p.thumbnail || p.thumbnail === '/no-image.svg' || p.thumbnail.includes('no_selection');

    if (thumbBrokenOrMissing && hasValidGallery) {
      count++;
      console.log(`[Thumbnail missing but gallery exists] SKU: ${p.sku} | Name: "${p.name}"`);
      console.log(`   Gallery[0]: ${p.images[0].url}`);
    }
  }

  console.log(`\nTotal products where thumbnail is missing/no-image but gallery has valid images: ${count}`);
  await mongoose.disconnect();
}
checkThumbnailVsImages().catch(console.error);
