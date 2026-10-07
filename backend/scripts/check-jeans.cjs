const mongoose = require("mongoose");

async function check() {
  await mongoose.connect("mongodb+srv://store4riders:Yv2k1Kk5xI3TjQ7D@s4r-cluster.j6zud.mongodb.net/store4riders?retryWrites=true&w=majority");
  
  const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }));
  
  const query = {
    status: { $nin: ["draft", "archived"] },
    visibility: { $nin: ["1", "Not Visible Individually"] },
    $or: [{ name: /\bjeans?\b/i }, { magentoCategories: /\bjeans?\b/i }]
  };
  
  console.log("Running query:", JSON.stringify(query));
  
  const products = await Product.find(query).select("name magentoCategories status visibility").lean().exec();
  
  console.log(`Found ${products.length} products`);
  for (let i = 0; i < Math.min(5, products.length); i++) {
    console.log(products[i]);
  }
  
  process.exit(0);
}

check().catch(console.error);
