const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";
const navFile = 'frontend/src/modules/homepage/components/navbar/nav.constants.ts';

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB.");
    const db = client.db('store4riders');
    const brands = await db.collection('brands').find({}).toArray();
    
    let code = fs.readFileSync(navFile, 'utf8');
    
    // Process each brand in the database
    brands.forEach(b => {
      if (!b.logo) return;
      
      const brandName = b.name;
      // We will look for { label: "BrandName", href: "...", logoUrl: "..." }
      // The regex needs to handle the existing base64 string or any logoUrl safely.
      // Easiest is to replace the logoUrl value completely if the label matches.
      
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedLabel = escapeRegExp(brandName);
      
      // Match something like: label: "AGV", href: "/products?brand=agv", logoUrl: "data:image/svg+xml;base64,..."
      // Let's replace the whole logoUrl property value.
      // We'll use a replacer function to be precise.
      
      const regex = new RegExp(`({\\s*label:\\s*["']${escapedLabel}["']\\s*,[^}]+logoUrl:\\s*)["'][^"']+["']`, 'ig');
      code = code.replace(regex, `$1"${b.logo}"`);
      
      // If MT Helmets vs MT, handle common aliases
      if (brandName.toLowerCase() === 'mt' || brandName.toLowerCase() === 'mt helmets') {
        const mtRegex = new RegExp(`({\\s*label:\\s*["']MT Helmets["']\\s*,[^}]+logoUrl:\\s*)["'][^"']+["']`, 'ig');
        code = code.replace(mtRegex, `$1"${b.logo}"`);
      }
    });

    fs.writeFileSync(navFile, code);
    console.log("Successfully updated nav.constants.ts with real S3 logos!");
  } catch (error) {
    console.error("Error connecting or updating:", error);
  } finally {
    await client.close();
  }
}

run();
