const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: "backend/.env" });

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function run() {
  try {
    let isTruncated = true;
    let continuationToken = undefined;
    const allKeys = [];
    
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET || "store4riders",
        ContinuationToken: continuationToken
      });
      const response = await s3.send(command);
      response.Contents.forEach(c => allKeys.push(c.Key));
      
      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }
    
    console.log("Total objects in S3:", allKeys.length);
    
    const brandsToFind = ['agv', 'hjc', 'ls2', 'axor', 'smk', 'alpinestars', 'rynox', 'shima', 'sena'];
    brandsToFind.forEach(b => {
      const matches = allKeys.filter(k => k.toLowerCase().includes(b) && (k.endsWith('.png') || k.endsWith('.jpg') || k.endsWith('.svg')));
      console.log(`Matches for ${b}:`, matches.slice(0, 3));
    });

  } catch (error) {
    console.error(error);
  }
}
run();
