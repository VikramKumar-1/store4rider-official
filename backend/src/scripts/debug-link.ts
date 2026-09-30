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
    
    // Find lines with 'Click here' or 'youtube' or 'href' near 'measure'
    const lines = html.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('click here') || line.toLowerCase().includes('measure')) {
        console.log("Found line:", line.trim());
      }
    }
  } else {
    console.log("No description found.");
  }

  await mongoose.disconnect();
}

run().catch(console.error);
