const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
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

async function checkDiff() {
  const progressPath = path.join(__dirname, '..', '..', '..', 'backup-data', '.sync-progress.json');
  const alreadyUploaded = new Set(JSON.parse(fs.readFileSync(progressPath, 'utf8')));
  console.log(`Already uploaded in new bucket: ${alreadyUploaded.size}`);

  let token = undefined;
  let totalInOld = 0;
  const missingFromNew = [];

  do {
    const res = await oldS3.send(new ListObjectsV2Command({
      Bucket: 'store4riders',
      Prefix: 'catalog/product/',
      ContinuationToken: token,
      MaxKeys: 1000,
    }));

    if (res.Contents) {
      for (const item of res.Contents) {
        totalInOld++;
        const ext = path.extname(item.Key).toLowerCase();
        const baseWithoutExt = item.Key.replace(/\.[^/.]+$/, '');
        const webpKey = baseWithoutExt + '.webp';

        if (!alreadyUploaded.has(webpKey) && !alreadyUploaded.has(item.Key)) {
          missingFromNew.push({ key: item.Key, webpKey, size: item.Size });
        }
      }
    }
    token = res.NextContinuationToken;
  } while (token);

  console.log(`Total catalog images in old bucket: ${totalInOld}`);
  console.log(`Images in old bucket that are MISSING in new CloudFront bucket: ${missingFromNew.length}`);

  // Breakdown by first letter
  const letterMap = {};
  for (const m of missingFromNew) {
    const parts = m.key.split('/');
    const letter = parts[2] || 'other';
    letterMap[letter] = (letterMap[letter] || 0) + 1;
  }
  console.log('\nMissing breakdown by letter:');
  console.log(letterMap);
}

checkDiff().catch(console.error);
