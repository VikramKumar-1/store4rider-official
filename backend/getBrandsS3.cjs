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
      Prefix: "brand-logos/"
    });
    const response = await s3.send(command);
    
    if (response.Contents) {
      console.dir(response.Contents.map(c => c.Key), { maxArrayLength: null });
    } else {
      console.log("No logos found under brand-logos/");
    }
  } catch (error) {
    console.error(error);
  }
}
run();
