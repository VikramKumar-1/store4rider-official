import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function checkS3() {
  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
  });

  const bucket = process.env.AWS_S3_BUCKET_NAME || 'store4riders';

  try {
    console.log(`Checking S3 Bucket: ${bucket}`);
    
    // Check what folders exist at the root
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 20,
      Prefix: 'wysiwyg/'
    });
    
    const response = await s3.send(command);
    if (response.Contents && response.Contents.length > 0) {
      console.log(`\nFound files under 'wysiwyg/':`);
      response.Contents.slice(0, 5).forEach(c => console.log(` - ${c.Key}`));
    } else {
      console.log(`\nNo files found under 'wysiwyg/' prefix.`);
    }

    // Try media/wysiwyg/
    const command2 = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 5,
      Prefix: 'media/wysiwyg/'
    });
    const response2 = await s3.send(command2);
    if (response2.Contents && response2.Contents.length > 0) {
      console.log(`\nFound files under 'media/wysiwyg/':`);
      response2.Contents.forEach(c => console.log(` - ${c.Key}`));
    } else {
      console.log(`\nNo files found under 'media/wysiwyg/' prefix.`);
    }
    
    // Try pub/media/wysiwyg/
    const command3 = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 5,
      Prefix: 'pub/media/wysiwyg/'
    });
    const response3 = await s3.send(command3);
    if (response3.Contents && response3.Contents.length > 0) {
      console.log(`\nFound files under 'pub/media/wysiwyg/':`);
      response3.Contents.forEach(c => console.log(` - ${c.Key}`));
    } else {
      console.log(`\nNo files found under 'pub/media/wysiwyg/' prefix.`);
    }

  } catch (error: any) {
    console.error("Error accessing S3:", error.message);
  }
}

checkS3();
