import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || '';

async function audit() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB');

  const productsColl = db.collection('products');

  const totalProducts = await productsColl.countDocuments();
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(` 1. STOCK INVENTORY AUDIT (Total in DB: ${totalProducts})`);
  console.log(`══════════════════════════════════════════════════════`);

  // Query engine stock condition
  const inStockCondition = {
    visibility: { $ne: "Not Visible Individually" },
    $or: [
      { allowBackorders: true },
      { "variants.stock": { $gt: 0 } },
      {
        $and: [
          { "variants.0": { $exists: false } },
          { stockStatus: { $ne: 0 } },
          { qty: { $gt: 0 } }
        ]
      }
    ]
  };

  const inStockCount = await productsColl.countDocuments(inStockCondition);
  const oosCount = totalProducts - inStockCount;

  console.log(`- Products visible & in-stock according to query engine: ${inStockCount}`);
  console.log(`- Products out-of-stock (hidden): ${oosCount}`);

  // Breakdown by productType
  const configurableTotal = await productsColl.countDocuments({ productType: 'configurable' });
  const configurableInStock = await productsColl.countDocuments({ productType: 'configurable', ...inStockCondition });
  const simpleTotal = await productsColl.countDocuments({ productType: 'simple' });
  const simpleInStock = await productsColl.countDocuments({ productType: 'simple', ...inStockCondition });

  console.log(`\nBreakdown by Product Type:`);
  console.log(`- Configurable Products: ${configurableTotal} total | ${configurableInStock} in-stock (${configurableTotal - configurableInStock} OOS)`);
  console.log(`- Simple Products:       ${simpleTotal} total | ${simpleInStock} in-stock (${simpleTotal - simpleInStock} OOS)`);

  // Edge cases check
  const stockMismatch1 = await productsColl.countDocuments({
    'variants.0': { $exists: false },
    stockStatus: 1,
    qty: { $lte: 0 },
    allowBackorders: { $ne: true }
  });
  console.log(`- Simple products with stockStatus=1 but qty<=0: ${stockMismatch1}`);

  const stockMismatch2 = await productsColl.countDocuments({
    'variants.0': { $exists: false },
    stockStatus: 0,
    qty: { $gt: 0 },
    allowBackorders: { $ne: true }
  });
  console.log(`- Simple products with stockStatus=0 but qty>0: ${stockMismatch2}`);

  const configZeroVariantsStock = await productsColl.countDocuments({
    productType: 'configurable',
    'variants.0': { $exists: true },
    'variants.stock': { $not: { $gt: 0 } }
  });
  console.log(`- Configurable products where ALL variants have stock=0: ${configZeroVariantsStock}`);

  // Check top 10 categories stock numbers
  console.log(`\n══════════════════════════════════════════════════════`);
  console.log(` 2. CATEGORY STOCK AUDIT (In-Stock vs Total per Category)`);
  console.log(`══════════════════════════════════════════════════════`);

  const categoriesToCheck = [
    'motorcycle-helmets',
    'full-face-helmets',
    'modular-helmets',
    'off-road-helmets',
    'riding-gear',
    'riding-jackets',
    'riding-gloves',
    'motorcycle-riding-boots',
    'motorcycle-bags-bike-luggage',
    'hydration-bag',
    'saddle-bags-bikes',
    'chain-sprocket-kits'
  ];

  for (const catSlug of categoriesToCheck) {
    const catTotal = await productsColl.countDocuments({ categorySlugs: catSlug });
    const catInStock = await productsColl.countDocuments({ categorySlugs: catSlug, ...inStockCondition });
    console.log(`- ${catSlug.padEnd(30)}: Total=${catTotal.toString().padStart(4)} | In-Stock=${catInStock.toString().padStart(4)} | OOS=${(catTotal - catInStock).toString().padStart(3)}`);
  }

  await mongoose.disconnect();
}

audit().catch(console.error);
