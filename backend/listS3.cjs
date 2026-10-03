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
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET || "store4riders",
    });
    const response = await s3.send(command);
    
    // Output objects with 'brand' or 'logo' in their key
    const logos = response.Contents
      .map(c => c.Key)
      .filter(k => k.toLowerCase().includes('brand') || k.toLowerCase().includes('logo'));
      
    console.log("Found in S3:", logos);
    console.log("All contents count:", response.Contents.length);
    
    if (logos.length < 5) {
       console.log("Top 10 items in bucket:", response.Contents.slice(0, 10).map(c => c.Key));
    }
  } catch (error) {
    console.error(error);
  }
}
run();
