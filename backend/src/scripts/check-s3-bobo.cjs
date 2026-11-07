const { S3Client, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkS3() {
  const key = 'catalog/product/b/o/bobo-bm4-pro-jaw-grip-bike-phone-holder-with-vibration-controller-motorcycle-mobile-mount-_1_.webp';
  console.log('Checking S3 key:', key);
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: 'store4riders-media', Key: key }));
    console.log('HeadObject SUCCESS:');
    console.log('Content-Type:', head.ContentType);
    console.log('Content-Length:', head.ContentLength);
  } catch (err) {
    console.log('HeadObject FAILED:', err.name, err.message);
  }

  // Also list objects with prefix catalog/product/b/o/bobo-bm4
  console.log('\nListing catalog/product/b/o/bobo-bm4 in store4riders-media:');
  const list = await s3.send(new ListObjectsV2Command({
    Bucket: 'store4riders-media',
    Prefix: 'catalog/product/b/o/bobo-bm4',
  }));
  if (list.Contents) {
    for (const c of list.Contents) {
      console.log(` - ${c.Key} (${c.Size} bytes)`);
    }
  } else {
    console.log('No contents found with that prefix!');
  }
}

checkS3().catch(console.error);
