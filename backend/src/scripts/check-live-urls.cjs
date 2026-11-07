const mongoose = require('mongoose');
const https = require('https');
require('dotenv').config({ path: 'backend/.env' });

function testUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 5000,
      }, (res) => {
        resolve({ status: res.statusCode, url });
      });
      req.on('error', () => resolve({ status: 500, url }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 504, url }); });
      req.end();
    } catch (e) {
      resolve({ status: 400, url });
    }
  });
}

async function checkBatch() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products')
    .find({ thumbnail: { $regex: '^https' } })
    .limit(100)
    .project({ sku: 1, name: 1, thumbnail: 1 })
    .toArray();

  console.log(`Testing first ${products.length} products on CloudFront...`);

  let okCount = 0;
  let failCount = 0;
  const failed = [];

  for (const p of products) {
    const res = await testUrl(p.thumbnail);
    if (res.status === 200) {
      okCount++;
    } else {
      failCount++;
      failed.push({ sku: p.sku, name: p.name, status: res.status, url: p.thumbnail });
    }
  }

  console.log(`\nResults:`);
  console.log(`- 200 OK (Working): ${okCount}`);
  console.log(`- Failed (403/404): ${failCount}`);
  if (failed.length > 0) {
    console.log(`\nFailed sample products:`);
    failed.slice(0, 15).forEach(f => {
      console.log(`[Status ${f.status}] SKU: ${f.sku} | "${f.name}" -> ${f.url}`);
    });
  }

  await mongoose.disconnect();
}

checkBatch().catch(console.error);
