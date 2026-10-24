import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  
  const allCats = await Category.find({
    description: { $regex: 'href=', $options: 'i' }
  }).select('name slug description').lean();

  console.log(`Found ${allCats.length} categories with HTML links in description:`);
  
  for (const c of allCats as any[]) {
    const matches = (c.description as string).match(/href="([^"]+)"/g);
    if (matches) {
      console.log(`\nCategory: "${c.name}" (slug: "${c.slug}")`);
      const priceLinks = matches.filter(m => m.includes('below') || m.includes('between') || m.includes('premium') || m.includes('price') || m.includes('6000') || m.includes('8000') || m.includes('10000'));
      if (priceLinks.length > 0) {
        console.log(' -> Price / Bracket Links:');
        priceLinks.forEach(l => console.log('   ', l));
      }
    }
  }

  await mongoose.disconnect();
}

check().catch(console.error);
