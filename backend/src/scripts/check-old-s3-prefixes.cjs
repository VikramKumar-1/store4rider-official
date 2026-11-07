const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const oldS3 = new S3Client({
  region: 'ap-south-2',
  credentials: {
    accessKeyId: process.env.OLD_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkOldS3() {
  console.log('Listing old S3 for bobo-bm4-pro:');
  const res = await oldS3.send(new ListObjectsV2Command({
    Bucket: 'store4riders',
    Prefix: 'catalog/product/b/o/bobo-bm4-pro',
  }));
  if (res.Contents) {
    for (const c of res.Contents) {
      console.log(` - ${c.Key} (${c.Size} bytes)`);
    }
  }

  // Also check if there's any other prefix in old S3! e.g., media/catalog/product, or pub/media, or orig, or anything
  console.log('\nChecking top prefixes in old S3:');
  const prefixes = await oldS3.send(new ListObjectsV2Command({
    Bucket: 'store4riders',
    Delimiter: '/',
  }));
  console.log('Common prefixes in old S3:', prefixes.CommonPrefixes);
}

checkOldS3().catch(console.error);
