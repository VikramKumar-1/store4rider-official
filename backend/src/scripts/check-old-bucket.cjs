const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', 'backend', '.env') });

const s3 = new S3Client({
  region: 'ap-south-2',
  credentials: {
    accessKeyId: process.env.OLD_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.OLD_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function listOldBucket() {
  let token = undefined;
  let count = 0;
  const prefixes = new Set();

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: 'store4riders',
      Prefix: 'catalog/product/',
      ContinuationToken: token,
      MaxKeys: 1000,
    }));

    if (res.Contents) {
      count += res.Contents.length;
      for (const item of res.Contents) {
        const parts = item.Key.split('/');
        if (parts[2]) prefixes.add(parts[2]);
      }
    }
    token = res.NextContinuationToken;
    if (count % 10000 === 0) {
      console.log(`Scanned ${count} objects so far...`);
    }
  } while (token);

  console.log(`\n=== OLD BUCKET (store4riders in ap-south-2) ===`);
  console.log(`Total Objects under catalog/product/: ${count}`);
  console.log(`Subfolder letters found:`, Array.from(prefixes).sort().join(', '));
}

listOldBucket().catch(console.error);
