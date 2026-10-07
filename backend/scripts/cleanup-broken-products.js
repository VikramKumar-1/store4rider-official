import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'backend/.env' });

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Product = mongoose.connection.collection('products');
  
  const configurables = await Product.find({ 
    productType: 'configurable',
    $or: [{ basePrice: { $in: [0, null] } }, { basePrice: { $exists: false } }]
  }).toArray();
  
  console.log(`Found ${configurables.length} zero-price configurable products to check.`);
  let hiddenCount = 0;

  for (const p of configurables) {
    let childSkus = [];
    if (p.configurableVariations) {
      const variants = p.configurableVariations.split("|");
      for (const variant of variants) {
        const attrs = variant.split(",");
        for (const attr of attrs) {
          const [key, value] = attr.split("=");
          if (key && key.trim().toLowerCase() === "sku" && value) {
            childSkus.push(value.trim());
          }
        }
      }
    }

    let hasChildren = false;
    
    if (childSkus.length > 0) {
      const children = await Product.find({ sku: { $in: childSkus } }).toArray();
      if (children.length > 0) hasChildren = true;
    } 
    
    if (!hasChildren && p.sku) {
      const prefixRegex = new RegExp(`^${p.sku}[-_]`, "i");
      const children = await Product.find({ sku: prefixRegex }).toArray();
      if (children.length > 0) hasChildren = true;
    }
    
    if (!hasChildren) {
      await Product.updateOne(
        { _id: p._id },
        { $set: { status: 'draft', visibility: 'Not Visible Individually' } }
      );
      hiddenCount++;
      console.log(`Hiding broken product: ${p.sku} (${p.name})`);
    }
  }

  console.log(`Cleanup complete. Hid ${hiddenCount} broken products.`);
  process.exit(0);
}

cleanup().catch(console.error);
