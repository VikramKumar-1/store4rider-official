import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB');

  const product = await db.collection('products').findOne({ sku: 'HOR-347' });
  console.log('HOR-347 Full Document:');
  console.log(JSON.stringify(product, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
