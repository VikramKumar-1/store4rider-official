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

const list = JSON.parse(fs.readFileSync('low-res-images.json'));

async function inspectLowResSources() {
  console.log(`Checking sources for ${list.length} low-res images...\n`);

  let foundInCa81 = 0;
  let foundInOldS3 = 0;
  let noHighResFound = 0;

  const samples = [];

  for (const item of list) {
    const key = item.key;
    // Strip .webp to get filename
    const baseWithoutExt = key.replace(/^catalog\/product\//, '').replace(/\.webp$/i, '');
    const cleanJpg = baseWithoutExt + '.jpg';
    const cleanPng = baseWithoutExt + '.png';

    // 1. Check local ca81863f8e838aca1592d58dbe0aa64f (544x544)
    const local544 = path.join('backup-data/extracted_media/cache/ca81863f8e838aca1592d58dbe0aa64f', cleanJpg);
    if (fs.existsSync(local544)) {
      foundInCa81++;
      if (samples.length < 5) samples.push({ key, source: 'local_ca81', path: local544 });
      continue;
    }

    // 2. Check old S3 catalog/product/...
    try {
      const res = await oldS3.send(new GetObjectCommand({
        Bucket: 'store4riders',
        Key: 'catalog/product/' + cleanJpg,
      }));
      foundInOldS3++;
      if (samples.length < 5) samples.push({ key, source: 'old_s3', path: 'catalog/product/' + cleanJpg });
      continue;
    } catch {}

    noHighResFound++;
  }

  console.log(`Results:`);
  console.log(`Found in local 544x544 cache (ca81): ${foundInCa81}`);
  console.log(`Found in old S3: ${foundInOldS3}`);
  console.log(`No higher res found in cache or old S3: ${noHighResFound}`);
  console.log('\nSamples found:', samples);
}

inspectLowResSources().catch(console.error);
