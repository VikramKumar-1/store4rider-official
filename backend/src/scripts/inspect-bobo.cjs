const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const oldS3 = new S3Client({
  region: 'ap-south-2',
  credentials: {
    accessKeyId: process.env.OLD_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const newS3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function inspectBobo() {
  const filename = 'bobo-bm4-pro-jaw-grip-bike-phone-holder-with-vibration-controller-motorcycle-mobile-mount-_1_';
  const webpKey = `catalog/product/b/o/${filename}.webp`;
  const jpgKey = `catalog/product/b/o/${filename}.jpg`;

  console.log('=== INSPECTING BOBO IMAGE ===');

  // 1. Check CloudFront
  try {
    const cfUrl = `https://d2zuvpvc0pfkya.cloudfront.net/${webpKey}`;
    const buf = await new Promise((res, rej) => {
      https.get(cfUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
        const c = [];
        r.on('data', d => c.push(d));
        r.on('end', () => res(Buffer.concat(c)));
      }).on('error', rej);
    });
    const meta = await sharp(buf).metadata();
    console.log(`1. CloudFront: ${meta.width}x${meta.height} (${buf.length} bytes, format: ${meta.format})`);
  } catch(e) {
    console.log('1. CloudFront error:', e.message);
  }

  // 2. Check New S3 (store4riders-media)
  try {
    const res = await newS3.send(new GetObjectCommand({ Bucket: 'store4riders-media', Key: webpKey }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    const meta = await sharp(buf).metadata();
    console.log(`2. New S3 (store4riders-media): ${meta.width}x${meta.height} (${buf.length} bytes)`);
  } catch(e) {
    console.log('2. New S3 error:', e.message);
  }

  // 3. Check Old S3 (store4riders in ap-south-2)
  try {
    const res = await oldS3.send(new GetObjectCommand({ Bucket: 'store4riders', Key: jpgKey }));
    const chunks = [];
    for await (const chunk of res.Body) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    const meta = await sharp(buf).metadata();
    console.log(`3. Old S3 (store4riders .jpg): ${meta.width}x${meta.height} (${buf.length} bytes)`);
  } catch(e) {
    console.log('3. Old S3 error:', e.message);
  }

  // 4. Check all local files matching bobo-bm4-pro
  console.log('4. Local files matching in extracted_media:');
  function walk(d) {
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.includes(filename)) {
        const sz = fs.statSync(full).size;
        console.log(`   - ${path.relative('backup-data/extracted_media', full)} (${sz} bytes)`);
      }
    }
  }
  try { walk('backup-data/extracted_media'); } catch(e) {}
}

inspectBobo().catch(console.error);
