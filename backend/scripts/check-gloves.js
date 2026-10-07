import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  const p = await Product.findOne({ name: /BBG Semi Gauntlet/i });
  console.log("BBG Semi Gauntlet:", p.magentoCategories, p.categorySlugs);
  
  const p2 = await Product.findOne({ name: /Scala Viper/i });
  console.log("Scala Viper:", p2?.magentoCategories, p2?.categorySlugs);

  process.exit(0);
}

check().catch(console.error);
