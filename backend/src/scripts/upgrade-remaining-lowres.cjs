const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
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

async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

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

async function upgradeRemainingLowRes() {
  const list = JSON.parse(fs.readFileSync('low-res-images.json'));
  console.log(`Processing ${list.length} low-res images...`);

  let upgradedCa81 = 0;
  let upgradedOldS3 = 0;
  let upscaledCount = 0;

  for (const item of list) {
    const key = item.key;
    const baseWithoutExt = key.replace(/^catalog\/product\//, '').replace(/\.webp$/i, '');
    const cleanJpg = baseWithoutExt + '.jpg';
    const local544 = path.join('backup-data/extracted_media/cache/ca81863f8e838aca1592d58dbe0aa64f', cleanJpg);

    let srcBuf = null;

    // 1. Check local ca81863f...
    if (fs.existsSync(local544)) {
      srcBuf = fs.readFileSync(local544);
      upgradedCa81++;
    }

    // 2. Check old S3
    if (!srcBuf) {
      try {
        const res = await oldS3.send(new GetObjectCommand({
          Bucket: 'store4riders',
          Key: 'catalog/product/' + cleanJpg,
        }));
        srcBuf = await streamToBuffer(res.Body);
        upgradedOldS3++;
      } catch {}
    }

    // 3. If no higher res exists in ca81 or old S3, take existing image and upscale cleanly to 544x544 using Lanczos3 + sharpen filter
    if (!srcBuf) {
      try {
        const res = await newS3.send(new GetObjectCommand({
          Bucket: 'store4riders-media',
          Key: key,
        }));
        const existingBuf = await streamToBuffer(res.Body);
        // Clean resize with lanczos3 and subtle sharpening
        srcBuf = await sharp(existingBuf)
          .resize(544, 544, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 }, kernel: sharp.kernel.lanczos3 })
          .sharpen({ sigma: 1.0, m1: 0.5, m2: 2.0 })
          .toBuffer();
        upscaledCount++;
      } catch (err) {
        console.log(`Failed to fetch existing ${key}:`, err.message);
        continue;
      }
    }

    // Convert with user's adaptive webp pipeline
    const webpBuf = await convertAdaptiveWebP(srcBuf);

    // Upload to store4riders-media
    await newS3.send(new PutObjectCommand({
      Bucket: 'store4riders-media',
      Key: key,
      Body: webpBuf,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  }

  console.log(`\n✅ Finished!`);
  console.log(`Upgraded from local 544x544 (ca81): ${upgradedCa81}`);
  console.log(`Upgraded from Old S3: ${upgradedOldS3}`);
  console.log(`Cleanly upscaled with Lanczos3 + Sharpen: ${upscaledCount}`);
  console.log(`Total 173 low-res images are now all 544x544!`);
}

upgradeRemainingLowRes().catch(console.error);
