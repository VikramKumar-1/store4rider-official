const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');
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

async function streamToBuffer(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function copyUploadsAndFixDb() {
  console.log('1. Copying all uploads/ from old S3 to new S3...');
  const res = await oldS3.send(new ListObjectsV2Command({
    Bucket: 'store4riders',
    Prefix: 'uploads/',
  }));

  const items = res.Contents || [];
  console.log(`Found ${items.length} items in uploads/. Copying...`);

  for (const item of items) {
    const getRes = await oldS3.send(new GetObjectCommand({
      Bucket: 'store4riders',
      Key: item.Key,
    }));
    const buf = await streamToBuffer(getRes.Body);

    await newS3.send(new PutObjectCommand({
      Bucket: 'store4riders-media',
      Key: item.Key,
      Body: buf,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    console.log(`  Copied: ${item.Key}`);
  }

  // Also put under catalog/product/uploads/ so BOTH URLs work!
  for (const item of items) {
    const getRes = await oldS3.send(new GetObjectCommand({
      Bucket: 'store4riders',
      Key: item.Key,
    }));
    const buf = await streamToBuffer(getRes.Body);
    await newS3.send(new PutObjectCommand({
      Bucket: 'store4riders-media',
      Key: 'catalog/product/' + item.Key,
      Body: buf,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
  }

  console.log('\n2. Fixing MongoDB URLs for no_selection and uploads...');
  await mongoose.connect(process.env.MONGODB_URI);
  const productsColl = mongoose.connection.db.collection('products');

  // Fix no_selection to /no-image.svg
  await productsColl.updateMany(
    { thumbnail: { $regex: 'no_selection' } },
    { $set: { thumbnail: '/no-image.svg' } }
  );

  console.log('✅ Done!');
  await mongoose.disconnect();
}

copyUploadsAndFixDb().catch(console.error);
