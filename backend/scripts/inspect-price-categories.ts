import fs from 'fs';
import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function check() {
  // 1. Check CSV
  const fileStream = fs.createReadStream('backup-data/latestcsv.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const priceCats = new Set<string>();
  let count = 0;

  for await (const line of rl) {
    if (line.includes('Below Rs.6000') || line.includes('Between Rs.6000') || line.includes('Between Rs.8000') || line.includes('Between Rs.10000') || line.includes('Premium Mesh')) {
      count++;
      const parts = line.split(',');
      for (const p of parts) {
        if (p.includes('Below Rs') || p.includes('Between Rs') || p.includes('Premium Mesh')) {
          priceCats.add(p.replace(/"/g, '').trim());
        }
      }
    }
  }

  console.log('Total products in CSV with price bracket in categories column:', count);
  console.log('Unique price paths found in CSV:');
  priceCats.forEach(c => console.log(' ->', c));

  // 2. Check MongoDB Category collection
  await mongoose.connect(process.env.MONGODB_URI as string);
  const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }));
  
  const allCategories = await Category.find({}).select('name slug level parentId').lean();
  console.log('\nTotal categories in MongoDB:', allCategories.length);

  const matched = (allCategories as any[]).filter(c => 
    c.name?.toLowerCase().includes('below') || 
    c.name?.toLowerCase().includes('between') || 
    c.name?.toLowerCase().includes('price') ||
    c.name?.toLowerCase().includes('mesh')
  );

  console.log('Matching categories in MongoDB:');
  matched.forEach(m => console.log(' -> Name:', m.name, '| Slug:', m.slug, '| Level:', m.level));

  await mongoose.disconnect();
}

check().catch(console.error);
