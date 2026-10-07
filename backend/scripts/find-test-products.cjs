const mongoose = require("mongoose");

async function findTestProducts() {
  await mongoose.connect("mongodb+srv://store4riders:Yv2k1Kk5xI3TjQ7D@s4r-cluster.j6zud.mongodb.net/store4riders?retryWrites=true&w=majority");
  
  const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }));
  
  console.log("Searching for test products...\n");

  // Find a product that is COMPLETELY Sold Out
  const soldOutProduct = await Product.findOne({
    status: { $nin: ["draft", "archived"] },
    productType: "configurable",
    "variants.stock": 0,
    "variants": { $not: { $elemMatch: { stock: { $gt: 0 } } } } // No variant has stock > 0
  }).select("name slug").lean();

  if (soldOutProduct) {
    console.log("🔴 100% SOLD OUT PRODUCT:");
    console.log(`Name: ${soldOutProduct.name}`);
    console.log(`Link: http://localhost:3000/products/${soldOutProduct.slug}\n`);
  } else {
    console.log("🔴 No 100% Sold Out configurable product found.\n");
  }

  // Find a product that has PARTIAL stock (Some variants 0, some > 0)
  const partialStockProduct = await Product.findOne({
    status: { $nin: ["draft", "archived"] },
    productType: "configurable",
    "variants.stock": 0, // At least one variant has stock 0
    "variants": { $elemMatch: { stock: { $gt: 0 } } } // At least one variant has stock > 0
  }).select("name slug variants").lean();

  if (partialStockProduct) {
    console.log("🟡 PARTIALLY OUT OF STOCK PRODUCT (Some Sizes/Colors are disabled):");
    console.log(`Name: ${partialStockProduct.name}`);
    console.log(`Link: http://localhost:3000/products/${partialStockProduct.slug}`);
    
    // Print which ones are out of stock
    const outOfStock = partialStockProduct.variants.filter(v => v.stock === 0);
    console.log(`Out of stock variants to test:`);
    outOfStock.slice(0, 3).forEach(v => {
      console.log(` - Color: ${v.attributes?.color || 'N/A'}, Size: ${v.attributes?.size || v.attributes?.eu_size || 'N/A'}`);
    });
  } else {
    console.log("🟡 No partially out of stock product found.");
  }
  
  process.exit(0);
}

findTestProducts().catch(console.error);
