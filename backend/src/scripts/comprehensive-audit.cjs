const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 4000,
      }, (res) => {
        resolve({ status: res.statusCode, ok: res.statusCode === 200 });
      });
      req.on('error', () => resolve({ status: 500, ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 504, ok: false }); });
      req.end();
    } catch {
      resolve({ status: 400, ok: false });
    }
  });
}

async function runAudit() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log(`Auditing all ${products.length} products in MongoDB Atlas against CloudFront CDN...\n`);

  let totalProducts = products.length;
  let productsWithImages = 0;
  let productsWithoutImages = 0;
  let workingImages = 0;
  let failingImages = 0;
  const failures = [];

  const BATCH_SIZE = 40;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (p) => {
      if (!p.thumbnail || p.thumbnail === '/no-image.svg') {
        productsWithoutImages++;
        return;
      }
      productsWithImages++;
      const res = await checkUrl(p.thumbnail);
      if (res.ok) {
        workingImages++;
      } else {
        failingImages++;
        failures.push({
          sku: p.sku,
          name: p.name,
          thumbnail: p.thumbnail,
          status: res.status,
        });
      }
    }));
    process.stdout.write(`\rAudited ${Math.min(i + BATCH_SIZE, totalProducts)}/${totalProducts} products...`);
  }

  console.log('\n\n========================================');
  console.log('       FULL PRODUCTION AUDIT REPORT     ');
  console.log('========================================');
  console.log(`Total Products in Database: ${totalProducts}`);
  console.log(`Products without Images (no image in CSV): ${productsWithoutImages}`);
  console.log(`Products WITH Images: ${productsWithImages}`);
  console.log(`✅ LIVE & WORKING (200 OK on CloudFront): ${workingImages} (${((workingImages / productsWithImages) * 100).toFixed(2)}%)`);
  console.log(`❌ FAILING (403/404): ${failingImages}`);

  if (failures.length > 0) {
    console.log('\nListing all failing products:');
    failures.forEach((f, idx) => {
      console.log(`${idx + 1}. [Status ${f.status}] SKU: ${f.sku} | Name: "${f.name}" -> ${f.thumbnail}`);
    });
    fs.writeFileSync(path.join(__dirname, 'audit-failures.json'), JSON.stringify(failures, null, 2));
  } else {
    console.log('\n🎉 100% PERFECT: Zero broken image URLs across the entire catalog!');
  }

  await mongoose.disconnect();
}

runAudit().catch(console.error);
