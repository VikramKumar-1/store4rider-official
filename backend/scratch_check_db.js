const mongoose = require("mongoose");
const MONGODB_URI = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const products = await db.collection("products").find({ sku: "BBGSB" }).toArray();
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}
run();
