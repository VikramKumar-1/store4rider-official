require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");

async function checkProduct() {
  await mongoose.connect(process.env.DATABASE_URL);
  
  const product = await mongoose.connection.db.collection("products").findOne({ 
    name: /Rynox H2Go Pro 3 Rain Jacket/i 
  });
  
  if (product) {
    console.log("PARENT:", {
      name: product.name,
      sku: product.sku,
      basePrice: product.basePrice,
      specialPrice: product.specialPrice,
      productType: product.productType,
      configurableVariations: product.configurableVariations,
      hasVariantsArray: !!(product.variants && product.variants.length > 0)
    });
    
    // Find children by SKU prefix
    const children = await mongoose.connection.db.collection("products").find({
      sku: { $regex: new RegExp(`^${product.sku}`, "i") }
    }).toArray();
    
    console.log(`Found ${children.length} potential children by SKU prefix.`);
    if (children.length > 0) {
      console.log("FIRST CHILD:", {
        sku: children[0].sku,
        basePrice: children[0].basePrice,
        specialPrice: children[0].specialPrice
      });
    }
  } else {
    console.log("Product not found");
  }
  
  process.exit(0);
}

checkProduct();
