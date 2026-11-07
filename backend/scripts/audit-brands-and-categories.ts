import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function audit() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  const Brand = mongoose.connection.collection('brands');
  const Category = mongoose.connection.collection('categories');
  const Product = mongoose.connection.collection('products');

  const brands = await Brand.find({}).sort({ name: 1 }).toArray();
  console.log('\n================ TOTAL BRANDS IN DB:', brands.length, '================');
  for (const b of brands) {
    const prodCount = await Product.countDocuments({
      $or: [
        { brand: b.name },
        { brand: b.slug },
        { 'attributes.brand': b.name },
        { brandId: b._id }
      ]
    });
    console.log(`- ${b.name} (slug: ${b.slug}) | Active: ${b.isActive} | Prods: ${prodCount} | Logo: ${!!b.logo}`);
  }

  // Check distinct brand values on products in Mongo
  const distinctBrands = await Product.distinct('brand');
  console.log('\n================ DISTINCT Product.brand VALUES IN DB (Count:', distinctBrands.length, ') ================');
  console.log(distinctBrands.filter(Boolean).sort());

  // Distinct manufacturer values on products in Mongo
  const distinctAttrBrands = await Product.distinct('attributes.brand');
  console.log('\n================ DISTINCT Product.attributes.brand VALUES IN DB (Count:', distinctAttrBrands.length, ') ================');
  console.log(distinctAttrBrands.filter(Boolean).sort());

  // Check total categories
  const catCount = await Category.countDocuments({});
  console.log('\n================ TOTAL CATEGORIES IN DB:', catCount, '================');

  // Let's check categories under helmets and riding gear
  const helmetCats = await Category.find({
    $or: [
      { slug: /helmet/i },
      { path: /helmet/i },
      { name: /helmet|axor|smk|ls2|mt/i }
    ]
  }).toArray();
  console.log('Helmet-related categories count:', helmetCats.length);

  process.exit(0);
}

audit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
