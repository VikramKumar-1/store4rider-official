import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/store4riders";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const ProductModel = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));

  const modularCategories = await ProductModel.distinct("magentoCategories", { magentoCategories: /modular|flip/i });
  console.log("Modular/Flip Categories found in DB:", modularCategories);

  const modularNames = await ProductModel.find({ name: /modular|flip/i }).select("name").lean();
  console.log("Names with modular/flip:", modularNames.slice(0, 10).map((m: any) => m.name));

  mongoose.disconnect();
}
check().catch(console.error);
