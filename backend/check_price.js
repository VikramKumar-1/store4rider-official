const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/Users/vikur/Downloads/store4riders/backend/.env" });

async function checkProduct() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");
  const db = mongoose.connection.db;
  const product = await db.collection("products").findOne({ name: /Rynox H2GO Pro 3 Rain Jacket/i });
  console.log(JSON.stringify(product, null, 2));
  process.exit(0);
}
checkProduct();
