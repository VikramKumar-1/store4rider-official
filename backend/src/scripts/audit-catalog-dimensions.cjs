const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const newS3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 3,
});

async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function auditCatalogDimensions() {
  console.log('=== AUDITING CATALOG IMAGE RESOLUTIONS ===\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log(`Auditing ${products.length} products...`);

  // Map of unique S3 keys to check
  const keyToProducts = new Map();

  for (const p of products) {
    const urls = [];
    if (p.thumbnail && typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http')) {
      urls.push(p.thumbnail);
    }
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img?.url && typeof img.url === 'string' && img.url.startsWith('http')) {
          urls.push(img.url);
        }
      }
    }

    for (const u of urls) {
      if (u.includes('no-image')) continue;
      const key = u.replace(/^https?:\/\/[^\/]+\//, '');
      if (!keyToProducts.has(key)) {
        keyToProducts.set(key, []);
      }
      keyToProducts.get(key).push({ name: p.name, sku: p.sku });
    }
  }

  const allKeys = Array.from(keyToProducts.keys());
  console.log(`Total unique catalog image keys: ${allKeys.length}\n`);

  const stats = {
    hd544: 0,
    largeOver544: 0,
    medium300to500: 0,
    lowUnder300: 0,
    missing: 0,
    errors: 0,
  };

  const lowResList = [];

  const BATCH_SIZE = 40;
  for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
    const batch = allKeys.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (key) => {
      try {
        const res = await newS3.send(new GetObjectCommand({
          Bucket: 'store4riders-media',
          Key: key,
        }));
        const buf = await streamToBuffer(res.Body);
        const meta = await sharp(buf).metadata();
        const maxDim = Math.max(meta.width || 0, meta.height || 0);

        if (maxDim > 544) {
          stats.largeOver544++;
        } else if (maxDim >= 500) {
          stats.hd544++;
        } else if (maxDim >= 300) {
          stats.medium300to500++;
          lowResList.push({ key, width: meta.width, height: meta.height, products: keyToProducts.get(key) });
        } else {
          stats.lowUnder300++;
          lowResList.push({ key, width: meta.width, height: meta.height, products: keyToProducts.get(key) });
        }
      } catch (err) {
        if (err.name === 'NoSuchKey') {
          stats.missing++;
        } else {
          stats.errors++;
        }
      }
    }));

    const progress = Math.min(i + BATCH_SIZE, allKeys.length);
    process.stdout.write(`\rChecked: ${progress}/${allKeys.length} | HD (>=500): ${stats.hd544 + stats.largeOver544} | Low (<500): ${stats.lowUnder300 + stats.medium300to500} | Missing: ${stats.missing}`);
  }

  console.log('\n\n=== AUDIT RESULTS ===');
  console.log(`Total Images Audited: ${allKeys.length}`);
  console.log(`HD 544x544 or higher: ${stats.hd544 + stats.largeOver544} (${((stats.hd544 + stats.largeOver544) / allKeys.length * 100).toFixed(1)}%)`);
  console.log(`  - 500px - 544px: ${stats.hd544}`);
  console.log(`  - > 544px: ${stats.largeOver544}`);
  console.log(`Medium (300px - 499px): ${stats.medium300to500}`);
  console.log(`Low-res (< 300px): ${stats.lowUnder300}`);
  console.log(`Missing on S3: ${stats.missing}`);
  console.log(`Errors: ${stats.errors}`);

  if (lowResList.length > 0) {
    console.log(`\nFound ${lowResList.length} images with width < 500px:`);
    for (const item of lowResList.slice(0, 20)) {
      const p = item.products[0] || {};
      console.log(` - [${item.width}x${item.height}] ${item.key} (Product: "${p.name}", SKU: ${p.sku})`);
    }
    const fs = require('fs');
    fs.writeFileSync('low-res-images.json', JSON.stringify(lowResList, null, 2));
    console.log(`Full low-res list saved to low-res-images.json`);
  }

  await mongoose.disconnect();
}

auditCatalogDimensions().catch(console.error);
