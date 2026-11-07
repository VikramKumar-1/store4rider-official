const { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const oldS3 = new S3Client({
  region: 'ap-south-2',
  credentials: {
    accessKeyId: process.env.OLD_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 5,
});

const newS3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 5,
});

const PROGRESS_FILE = path.join(__dirname, '..', '..', '..', 'backup-data', '.sync-progress.json');
const CONCURRENCY = 25;

async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function convertAdaptiveWebP(buf) {
  const origSize = buf.length;
  // Tier 1: Small photos (<50 KB) -> STRICT LOSSLESS WEBP (0% quality loss)
  if (origSize < 50 * 1024) {
    return sharp(buf).webp({ lossless: true, effort: 4 }).toBuffer();
  }
  // Tier 2: Medium photos (50 KB - 150 KB) -> Gentle optimization (quality 92)
  if (origSize <= 150 * 1024) {
    return sharp(buf).webp({ quality: 92, smartSubsample: true, effort: 5 }).toBuffer();
  }
  // Tier 3: Large HD photos (>150 KB) -> Quality 85 WebP
  return sharp(buf).webp({ quality: 85, smartSubsample: true, effort: 6 }).toBuffer();
}

async function runRemainingSync() {
  console.log('=== STARTING SYNC FOR REMAINING 2,870 IMAGES FROM OLD S3 ===\n');

  let alreadyUploaded = new Set();
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      alreadyUploaded = new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')));
    } catch (e) {}
  }
  console.log(`Current progress count: ${alreadyUploaded.size} images already in new bucket.`);

  // 1. Fetch missing list
  console.log('Scanning old bucket (store4riders in ap-south-2)...');
  let token = undefined;
  const missing = [];

  do {
    const res = await oldS3.send(new ListObjectsV2Command({
      Bucket: 'store4riders',
      Prefix: 'catalog/product/',
      ContinuationToken: token,
      MaxKeys: 1000,
    }));

    if (res.Contents) {
      for (const item of res.Contents) {
        const baseWithoutExt = item.Key.replace(/\.[^/.]+$/, '');
        const webpKey = baseWithoutExt + '.webp';

        if (!alreadyUploaded.has(webpKey) && !alreadyUploaded.has(item.Key)) {
          missing.push({ oldKey: item.Key, webpKey, size: item.Size });
        }
      }
    }
    token = res.NextContinuationToken;
  } while (token);

  console.log(`Found ${missing.length} missing images to stream and convert.\n`);

  if (missing.length === 0) {
    console.log('All images are already synced!');
  } else {
    let completed = 0;
    let failed = 0;
    let totalBytesSaved = 0;
    const startTime = Date.now();

    for (let i = 0; i < missing.length; i += CONCURRENCY) {
      const batch = missing.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (item) => {
        try {
          // 1. Get from old S3
          const getObj = await oldS3.send(new GetObjectCommand({
            Bucket: 'store4riders',
            Key: item.oldKey,
          }));
          const origBuf = await streamToBuffer(getObj.Body);

          // 2. Convert to WebP
          let outBuf;
          try {
            outBuf = await convertAdaptiveWebP(origBuf);
          } catch (sharpErr) {
            // If sharp fails to decode, fallback to original buffer
            outBuf = origBuf;
          }

          // 3. Put in new S3 with 1-year cache
          await newS3.send(new PutObjectCommand({
            Bucket: 'store4riders-media',
            Key: item.webpKey,
            Body: outBuf,
            ContentType: 'image/webp',
            CacheControl: 'public, max-age=31536000, immutable',
          }));

          alreadyUploaded.add(item.webpKey);
          completed++;
          totalBytesSaved += Math.max(0, origBuf.length - outBuf.length);
        } catch (err) {
          failed++;
          console.error(`[FAIL] ${item.oldKey}: ${err.message}`);
        }
      }));

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const pct = (((completed + failed) / missing.length) * 100).toFixed(1);
      process.stdout.write(`\rProgress: ${completed}/${missing.length} (${pct}%) | Failed: ${failed} | Elapsed: ${elapsed}s`);

      // Periodic state save every 100 items
      if (completed % 100 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(alreadyUploaded)));
      }
    }

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(alreadyUploaded)));
    console.log(`\n\n✅ Streamed, converted, and uploaded ${completed} images! (Failed: ${failed})`);
  }

  // 2. Fix Double .webp.webp in MongoDB Atlas
  console.log('\nConnecting to MongoDB Atlas to clean double .webp.webp extensions...');
  await mongoose.connect(process.env.MONGODB_URI);
  const productsColl = mongoose.connection.db.collection('products');

  const doubleWebpCursor = productsColl.find({
    $or: [
      { thumbnail: { $regex: '\\.webp\\.webp' } },
      { 'images.url': { $regex: '\\.webp\\.webp' } },
      { 'variants.imageUrl': { $regex: '\\.webp\\.webp' } },
    ]
  });

  let fixedCount = 0;
  for await (const prod of doubleWebpCursor) {
    const updates = {};
    if (prod.thumbnail && prod.thumbnail.includes('.webp.webp')) {
      updates.thumbnail = prod.thumbnail.replace(/(\.webp)+$/i, '.webp');
    }
    if (Array.isArray(prod.images)) {
      updates.images = prod.images.map(img => {
        if (!img?.url) return img;
        return { ...img, url: img.url.replace(/(\.webp)+$/i, '.webp') };
      });
    }
    if (Array.isArray(prod.variants)) {
      updates.variants = prod.variants.map(v => {
        if (!v) return v;
        const u = { ...v };
        if (v.imageUrl) u.imageUrl = v.imageUrl.replace(/(\.webp)+$/i, '.webp');
        return u;
      });
    }

    await productsColl.updateOne({ _id: prod._id }, { $set: updates });
    fixedCount++;
  }

  console.log(`✅ Fixed double .webp.webp extensions for ${fixedCount} products in MongoDB.`);

  await mongoose.disconnect();
  console.log('\n=== COMPLETE SYNC FINISHED SUCCESSFULLY ===');
}

runRemainingSync().catch(console.error);
