import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/store4riders";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const ProductModel = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));

  const modular = await ProductModel.find({ name: /SMK Gullwing/i }).select("name status stockStatus").lean();
  console.log(modular);

  mongoose.disconnect();
}
check().catch(console.error);
