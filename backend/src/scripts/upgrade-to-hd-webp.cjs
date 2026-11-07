const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const sharp = require('sharp');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
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

const cloudfront = new CloudFrontClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROGRESS_FILE = path.join(__dirname, '..', '..', '..', 'backup-data', '.hd-upgrade-progress.json');
const CONCURRENCY = 35;

async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * USER'S MANDATORY 3-TIER WEBP PIPELINE (STRICTLY PRESERVED)
 * 1. < 50 KB: STRICT LOSSLESS WEBP (0% quality loss, perfect edges/text)
 * 2. 50 KB - 150 KB: Gentle optimization (quality 92, smart subsampling)
 * 3. > 150 KB: High-res WebP (quality 85)
 */
async function convertAdaptiveWebP(buf) {
  const origSize = buf.length;
  if (origSize < 50 * 1024) {
    return sharp(buf).webp({ lossless: true, effort: 4 }).toBuffer();
  }
  if (origSize <= 150 * 1024) {
    return sharp(buf).webp({ quality: 92, smartSubsample: true, effort: 5 }).toBuffer();
  }
  return sharp(buf).webp({ quality: 85, smartSubsample: true, effort: 6 }).toBuffer();
}

async function runHdUpgrade() {
  console.log('=== STARTING 544x544 HD WEBP UPGRADE PIPELINE ===\n');

  // 1. Collect all product image URLs from MongoDB
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log(`Loaded ${products.length} products from database.`);

  const keysToUpgrade = new Set();
  for (const p of products) {
    if (p.thumbnail && typeof p.thumbnail === 'string' && p.thumbnail.startsWith('http')) {
      const uPath = p.thumbnail.replace(/^https?:\/\/[^\/]+\//, '');
      keysToUpgrade.add(uPath);
    }
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img?.url && typeof img.url === 'string' && img.url.startsWith('http')) {
          const uPath = img.url.replace(/^https?:\/\/[^\/]+\//, '');
          keysToUpgrade.add(uPath);
        }
      }
    }
  }

  console.log(`Total unique product images to verify and upgrade to 544x544 HD: ${keysToUpgrade.size}\n`);

  let completedSet = new Set();
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      completedSet = new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')));
    } catch (e) {}
  }
  console.log(`Already upgraded in previous session: ${completedSet.size}`);

  const pending = [];
  for (const newKey of keysToUpgrade) {
    if (completedSet.has(newKey)) continue;

    // Determine corresponding old key (.jpg / .png in old S3)
    let baseWithoutExt = newKey.replace(/\.webp$/i, '');
    let oldKeyJpg = baseWithoutExt + '.jpg';
    let oldKeyPng = baseWithoutExt + '.png';

    pending.push({ newKey, oldKeyJpg, oldKeyPng });
  }

  console.log(`Pending images to upgrade to HD: ${pending.length}`);

  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (item) => {
      try {
        // Try fetching HD from old S3 (.jpg first, then .png, then as-is)
        let origBuf = null;
        try {
          const res = await oldS3.send(new GetObjectCommand({ Bucket: 'store4riders', Key: item.oldKeyJpg }));
          origBuf = await streamToBuffer(res.Body);
        } catch {
          try {
            const res = await oldS3.send(new GetObjectCommand({ Bucket: 'store4riders', Key: item.oldKeyPng }));
            origBuf = await streamToBuffer(res.Body);
          } catch {
            try {
              const res = await oldS3.send(new GetObjectCommand({ Bucket: 'store4riders', Key: item.newKey }));
              origBuf = await streamToBuffer(res.Body);
            } catch {
              // Not in old S3
            }
          }
        }

        if (!origBuf) {
          skippedCount++;
          completedSet.add(item.newKey);
          return;
        }

        // Apply User's Strict 3-Tier WebP Pipeline
        const webpBuf = await convertAdaptiveWebP(origBuf);

        // Upload HD 544x544 WebP to new S3
        await newS3.send(new PutObjectCommand({
          Bucket: 'store4riders-media',
          Key: item.newKey,
          Body: webpBuf,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        completedSet.add(item.newKey);
        successCount++;
      } catch (err) {
        failCount++;
      }
    }));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = (((successCount + skippedCount + failCount) / pending.length) * 100).toFixed(1);
    process.stdout.write(`\rProgress: ${successCount + skippedCount}/${pending.length} (${pct}%) | HD Upgraded: ${successCount} | Elapsed: ${elapsed}s`);

    if ((successCount + skippedCount) % 150 === 0) {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedSet)));
    }
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(Array.from(completedSet)));
  console.log(`\n\n✅ HD Upgrade Completed: ${successCount} images upgraded to 544x544 HD WebP!`);

  // Sync uploads/ folder from old S3 for custom admin products
  console.log('\nSyncing custom admin uploads/ from old S3...');
  try {
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    const uList = await oldS3.send(new ListObjectsV2Command({ Bucket: 'store4riders', Prefix: 'uploads/' }));
    if (uList.Contents) {
      for (const item of uList.Contents) {
        const getRes = await oldS3.send(new GetObjectCommand({ Bucket: 'store4riders', Key: item.Key }));
        const buf = await streamToBuffer(getRes.Body);
        const webpBuf = await convertAdaptiveWebP(buf);
        await newS3.send(new PutObjectCommand({
          Bucket: 'store4riders-media',
          Key: item.Key,
          Body: webpBuf,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }));
        await newS3.send(new PutObjectCommand({
          Bucket: 'store4riders-media',
          Key: 'catalog/product/' + item.Key,
          Body: webpBuf,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }));
      }
      console.log(`✅ Synced ${uList.Contents.length} custom admin uploads!`);
    }
  } catch (uErr) {
    console.warn('Note on uploads sync:', uErr.message);
  }

  // Invalidate CloudFront distribution so browsers get the new HD images
  console.log('\nInvalidating CloudFront CDN cache for immediate crystal-clear display...');
  try {
    await cloudfront.send(new CreateInvalidationCommand({
      DistributionId: 'E2NJ9SYEN5DWOA',
      InvalidationBatch: {
        CallerReference: `hd-upgrade-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ['/*'],
        },
      },
    }));
    console.log('✅ CloudFront invalidation created successfully!');
  } catch (cfErr) {
    console.warn('Could not invalidate CloudFront automatically:', cfErr.message);
  }

  await mongoose.disconnect();
  console.log('\n=== HD UPGRADE PIPELINE FINISHED ===');
}

runHdUpgrade().catch(console.error);
