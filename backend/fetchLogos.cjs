const mongoose = require('mongoose');
const fs = require('fs');

const uri = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";
const navFile = 'frontend/src/modules/homepage/components/navbar/nav.constants.ts';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas!");
    const db = mongoose.connection.db;
    const brands = await db.collection('brands').find({}).toArray();
    
    let code = fs.readFileSync(navFile, 'utf8');
    let replacedCount = 0;
    
    brands.forEach(b => {
      if (!b.logo) return;
      const brandName = b.name;
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedLabel = escapeRegExp(brandName);
      
      const regex = new RegExp(`({\\s*label:\\s*["']${escapedLabel}["']\\s*,[^}]+logoUrl:\\s*)["'][^"']+["']`, 'ig');
      code = code.replace(regex, (match, p1) => {
        replacedCount++;
        return `${p1}"${b.logo}"`;
      });
      
      if (brandName.toLowerCase() === 'mt' || brandName.toLowerCase() === 'mt helmets') {
        const mtRegex = new RegExp(`({\\s*label:\\s*["']MT Helmets["']\\s*,[^}]+logoUrl:\\s*)["'][^"']+["']`, 'ig');
        code = code.replace(mtRegex, (match, p1) => {
          replacedCount++;
          return `${p1}"${b.logo}"`;
        });
      }
    });

    fs.writeFileSync(navFile, code);
    console.log("Successfully updated nav.constants.ts with real S3 logos! Replaced:", replacedCount);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
