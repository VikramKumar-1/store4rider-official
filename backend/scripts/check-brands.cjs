const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

const BRANDS_TO_CHECK = [
  "agv", "hjc", "ls2", "mt", "axor", "axxis", "smk", "vemar", "vega", 
  "alpinestars", "rynox", "shima", "viaterra", "dsg", "macna", "furygan", "raida", "knox", "forma", 
  "sena", "parani", "bobo", "bluarmor", "dirtsack", "shad", "maddog", 
  "apollo", "michelin", "pirelli", "motul", "k&n", "ngk", "bmc", "moto-torque", "barrel-exhaust"
];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function checkBrands() {
  await mongoose.connect(MONGODB_URI);
  const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));

  console.log("Checking zero-product brands...\n");

  const zeroBrands = [];

  for (const b of BRANDS_TO_CHECK) {
    const flexibleBrand = escapeRegExp(b).replace(/-/g, '[\\s\\-]');
    const regex = b === "mt" ? /\\bmt\\b|mt helmets/i : new RegExp(flexibleBrand, "i");
    const wordRegex = b === "mt" ? /\\bmt\\b/i : new RegExp(`\\b${flexibleBrand}\\b`, "i");

    const filter = {
      status: { $nin: ["draft", "archived"] },
      visibility: { $nin: ["1", "Not Visible Individually"] },
      $or: [
        { brand: { $regex: regex } },
        { "attributes.brand": { $regex: regex } },
        { name: { $regex: wordRegex } }
      ]
    };

    const count = await Product.countDocuments(filter);
    
    if (count === 0) {
      zeroBrands.push(b);
      // Let's see if it exists WITHOUT the status/visibility filter
      const allCount = await Product.countDocuments({
        $or: [
          { brand: { $regex: regex } },
          { "attributes.brand": { $regex: regex } },
          { name: { $regex: wordRegex } }
        ]
      });
      console.log(`[0 Products] ${b.toUpperCase()} (Total in DB including drafts: ${allCount})`);
    } else {
      // console.log(`[OK] ${b.toUpperCase()}: ${count} products`);
    }
  }

  console.log(`\nFound ${zeroBrands.length} brands with 0 active products.`);
  process.exit(0);
}

checkBrands().catch(console.error);
