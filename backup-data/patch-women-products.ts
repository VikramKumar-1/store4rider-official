import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function patchWomenProducts() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const ProductModel = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  // Identify known women's gear that lost their tag in the CSV
  // The user specifically mentioned "Scala Marvel Gloves" / Scala Marvel products.
  // We also know Alpinestars Stella, Macna Donna/Diva, Shima Miura, etc. are for women.
  const keywords = [
    'scala marvel',
    'stella',
    'banshee',
    'vence',
    'diva',
    'donna'
  ];

  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');

  const productsToUpdate = await ProductModel.find({
    name: regex,
    gender: { $not: /^(women|female|lady|ladies)$/i }, // Not explicitly marked already
    magentoCategories: { $not: /\briding gear for women\b/i } // Not already in the category
  });

  console.log(`Found ${productsToUpdate.length} products to patch.`);

  let updatedCount = 0;
  for (const p of productsToUpdate) {
    let newCats = p.magentoCategories || '';
    if (!newCats.includes('Riding Gear For Women')) {
      newCats = newCats ? newCats + ',Riding Gear For Women' : 'Riding Gear For Women';
      
      await ProductModel.updateOne({ _id: p._id }, { $set: { magentoCategories: newCats } });
      console.log(`Updated: ${p.name} | SKU: ${p.sku}`);
      updatedCount++;
    }
  }

  console.log(`Successfully patched ${updatedCount} products.`);
  mongoose.disconnect();
}

patchWomenProducts().catch(console.error);
