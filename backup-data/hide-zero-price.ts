import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

async function hideZeroPrice() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) throw new Error('No DB URI');
  await mongoose.connect(uri);
  
  // Archiving the 17 products with zero price
  const result = await mongoose.connection.collection('products').updateMany(
    { basePrice: { $lte: 0 } },
    { $set: { status: 'archived' } }
  );
  
  console.log(`Successfully archived ${result.modifiedCount} products.`);
  process.exit(0);
}

hideZeroPrice();
