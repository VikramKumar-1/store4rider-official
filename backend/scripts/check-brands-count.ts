import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '../backend/.env') });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const Brand = mongoose.connection.collection('brands');
  const allBrands = await Brand.find({}).sort({ name: 1 }).toArray();
  const activeBrands = await Brand.find({ isActive: { $ne: false } }).sort({ name: 1 }).toArray();

  console.log('Total brands in MongoDB:', allBrands.length);
  console.log('Active brands (returned by GET /brands):', activeBrands.length);
  console.log('\nAll Active Brands:');
  for (const b of activeBrands) {
    console.log(`- ${b.name} (${b.slug}) | logo: ${!!b.logo}`);
  }

  process.exit(0);
}

run().catch(console.error);
