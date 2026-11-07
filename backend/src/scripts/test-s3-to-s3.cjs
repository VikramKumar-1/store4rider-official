const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
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

async function streamTest() {
  const oldKey = 'catalog/product/s/m/smk-nova-track-_10__1.jpg';
  const newKey = 'catalog/product/s/m/smk-nova-track-_10__1.webp';

  console.log(`Fetching ${oldKey} from old S3...`);
  const getRes = await oldS3.send(new GetObjectCommand({
    Bucket: 'store4riders',
    Key: oldKey,
  }));

  const chunks = [];
  for await (const chunk of getRes.Body) {
    chunks.push(chunk);
  }
  const buf = Buffer.concat(chunks);
  console.log(`Got buffer: ${buf.length} bytes. Converting to WebP...`);

  const webpBuf = await sharp(buf).webp({ quality: 92, smartSubsample: true }).toBuffer();
  console.log(`Converted to WebP: ${webpBuf.length} bytes. Uploading to new S3...`);

  await newS3.send(new PutObjectCommand({
    Bucket: 'store4riders-media',
    Key: newKey,
    Body: webpBuf,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  console.log(`Successfully uploaded ${newKey} to store4riders-media!`);
}

streamTest().catch(console.error);
