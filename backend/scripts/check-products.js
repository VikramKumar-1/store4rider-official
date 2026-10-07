const mongoose = require("mongoose");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://store4riders:xRk6bM2r4j8zP1qW@cluster0.p71b2.mongodb.net/store4riders?retryWrites=true&w=majority&appName=Cluster0");
  const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false }));
  
  const p1 = await Product.findOne({ name: /Mashak/i }).lean();
  console.log("MASHAK:", JSON.stringify({ name: p1.name, magentoCategories: p1.magentoCategories, categorySlugs: p1.categorySlugs, gender: p1.gender }, null, 2));

  const p2 = await Product.findOne({ name: /Gullwing Helmet Visor/i }).lean();
  console.log("VISOR:", JSON.stringify({ name: p2.name, magentoCategories: p2.magentoCategories, categorySlugs: p2.categorySlugs, gender: p2.gender }, null, 2));

  process.exit();
}

check();
