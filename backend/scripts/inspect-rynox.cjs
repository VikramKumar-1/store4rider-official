const mongoose = require("mongoose");

async function investigate() {
  await mongoose.connect("mongodb+srv://store4riders:Yv2k1Kk5xI3TjQ7D@s4r-cluster.j6zud.mongodb.net/store4riders?retryWrites=true&w=majority");
  
  const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }));
  
  const p = await Product.findOne({ name: /Rynox H2Go Pro 3 Rain Jacket/i }).lean();
  console.log("Rynox Jacket:");
  console.log({
    sku: p?.sku,
    productType: p?.productType,
    basePrice: p?.basePrice,
    specialPrice: p?.specialPrice
  });

  if (p && p.sku) {
    const children = await Product.find({ sku: new RegExp(`^${p.sku}[-_]`, "i") }).lean();
    console.log(`\nFound ${children.length} children using regex ^${p.sku}[-_]`);
    if (children.length > 0) {
      console.log("First child price:", children[0].basePrice, children[0].specialPrice);
    }
  }

  process.exit(0);
}

investigate().catch(console.error);
