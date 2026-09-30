import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

async function checkStock() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri);
  const p = await mongoose.connection.collection('products').findOne({ sku: 'BBGHTB' });
  if(p) {
    console.log('Stock Status for BBGHTB:', p.stockStatus);
    console.log('Qty:', p.qty);
  } else {
    console.log('Product not found in DB');
  }
  process.exit(0);
}
checkStock();
