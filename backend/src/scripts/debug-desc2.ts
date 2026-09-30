import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store4riders';
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) return;

  const jacket = await db.collection('products').findOne({ sku: 'RH2GORJ' });
  if (jacket && jacket.description) {
    const html = jacket.description;
    console.log("--- ORIGINAL HTML ---");
    // Print lines containing 'img' or 'media'
    const imgLines = html.split('\n').filter((l: string) => l.includes('img') || l.includes('media'));
    console.log(imgLines.join('\n'));

    // Test the regex
    console.log("\n--- AFTER REGEX ---");
    const cleaned = html
      .replace(
        /\{\{media\s+url=(?:&quot;|"|')?(.*?)(?:&quot;|"|')?\}\}/gi,
        (_match: any, p1: string) => {
          const cleanPath = p1.replace(/&quot;/g, '').trim();
          const finalPath = cleanPath.startsWith('media/') ? cleanPath : `media/${cleanPath}`;
          return `https://store4riders.s3.ap-south-2.amazonaws.com/${finalPath}`;
        }
      )
      .replace(
        /src="\/media\//gi,
        'src="https://store4riders.s3.ap-south-2.amazonaws.com/media/'
      );
    const cleanedImgLines = cleaned.split('\n').filter((l: string) => l.includes('img') || l.includes('store4riders.s3'));
    console.log(cleanedImgLines.join('\n'));

  } else {
    console.log("No description found for RH2GORJ");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
