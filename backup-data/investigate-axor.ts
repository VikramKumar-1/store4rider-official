import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

async function investigate() {
  const searchTerm = 'Axor Apex Scratch';
  
  // 1. Check MongoDB
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
  const dbProducts = await mongoose.connection.collection('products')
    .find({ name: { $regex: searchTerm, $options: 'i' } })
    .toArray();
    
  console.log('--- MONGODB RESULTS ---');
  if (dbProducts.length > 0) {
    dbProducts.forEach(p => console.log(`DB Found: [${p.sku}] ${p.name} | Status: ${p.status} | Price: ${p.basePrice}`));
  } else {
    console.log('Not found in MongoDB.');
  }

  // 2. Check CSV
  console.log('\n--- CSV RESULTS ---');
  const CSV_FILE = 'C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv';
  const file = fs.readFileSync(CSV_FILE, 'utf8');
  const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });
  
  const csvProducts = (data as any[]).filter(r => r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (csvProducts.length > 0) {
    csvProducts.forEach(p => {
      console.log(`CSV Found: [${p.sku}] ${p.name}`);
      console.log(`   Type: ${p.product_type} | Visibility: ${p.visibility} | Price: ${p.price}`);
    });
  } else {
    console.log('Not found in CSV file either.');
  }

  process.exit(0);
}
investigate();
