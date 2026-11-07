const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_URL || 'https://d2zuvpvc0pfkya.cloudfront.net').trim();

function mapUrlToWebP(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string') return oldUrl;
  if (oldUrl === '/no-image.svg' || oldUrl.includes('data:image')) return oldUrl;

  // Extract relative path inside catalog/product/
  let clean = oldUrl
    .replace(/^https?:\/\/[^\/]+\//, '')
    .replace(/^catalog\/product\//, '')
    .replace(/^pub\/media\/catalog\/product\//, '')
    .replace(/^media\/catalog\/product\//, '')
    .replace(/^\/+/, '');

  if (!clean) return oldUrl;

  // Convert extension to .webp
  const cleanWebP = clean.replace(/\.(jpe?g|png|gif|bmp|tiff)$/i, '') + '.webp';
  return `${CDN_BASE}/catalog/product/${cleanWebP}`;
}

async function syncDatabase() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('âœ… Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const productsColl = db.collection('products');
  const total = await productsColl.countDocuments();
  console.log(`Found ${total} products to process.\n`);

  const cursor = productsColl.find({});
  let updatedCount = 0;

  for await (const prod of cursor) {
    let modified = false;
    const updates = {};

    // 1. Map Thumbnail
    if (prod.thumbnail) {
      const newThumb = mapUrlToWebP(prod.thumbnail);
      if (newThumb !== prod.thumbnail) {
        updates.thumbnail = newThumb;
        modified = true;
      }
    }

    // 2. Map Images Array
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      const newImages = prod.images.map(img => {
        if (!img || !img.url) return img;
        const newUrl = mapUrlToWebP(img.url);
        return { ...img, url: newUrl };
      });
      updates.images = newImages;
      modified = true;

      if (!updates.thumbnail && newImages[0]?.url) {
        updates.thumbnail = newImages[0].url;
      }
    }

    // 3. Map Variants
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      let variantModified = false;
      const newVariants = prod.variants.map(v => {
        if (!v) return v;
        const updated = { ...v };
        if (v.imageUrl) {
          updated.imageUrl = mapUrlToWebP(v.imageUrl);
          variantModified = true;
        }
        if (Array.isArray(v.images)) {
          updated.images = v.images.map(im => {
            if (typeof im === 'string') return mapUrlToWebP(im);
            if (im?.url) return { ...im, url: mapUrlToWebP(im.url) };
            return im;
          });
          variantModified = true;
        }
        return updated;
      });
      if (variantModified) {
        updates.variants = newVariants;
        modified = true;
      }
    }

    // 4. Map colorImages Map/Object
    if (prod.colorImages && typeof prod.colorImages === 'object') {
      const newColorImages = {};
      let cModified = false;
      for (const [col, cUrl] of Object.entries(prod.colorImages)) {
        if (typeof cUrl === 'string') {
          newColorImages[col] = mapUrlToWebP(cUrl);
          cModified = true;
        } else {
          newColorImages[col] = cUrl;
        }
      }
      if (cModified) {
        updates.colorImages = newColorImages;
        modified = true;
      }
    }

    if (modified) {
      await productsColl.updateOne({ _id: prod._id }, { $set: updates });
      updatedCount++;
    }
  }

  console.log(`\nâœ… Successfully updated ${updatedCount} products in MongoDB with CloudFront WebP URLs!`);

  // Verify sample product
  const sample = await productsColl.findOne({ sku: 'MV14PLI' });
  if (sample) {
    console.log('\n--- VERIFICATION SAMPLE (SKU: MV14PLI) ---');
    console.log('Thumbnail:', sample.thumbnail);
    console.log('Images[0]:', sample.images?.[0]?.url);
  }

  await mongoose.disconnect();
  console.log('MongoDB disconnected cleanly.');
}

syncDatabase().catch(console.error);
