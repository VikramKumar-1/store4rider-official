import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/store4riders";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const ProductModel = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));

  const category = "modular-helmets";
  const slugParts = category.split("-");
  const searchTerms = slugParts.filter((p: string) => !["for", "and", "in", "the", "men", "women", "unisex"].includes(p));
  const regexPattern = searchTerms.map((term: string) => `(?=.*\\b${term}\\b)`).join("");
  const regex = new RegExp(`^${regexPattern}.*`, "i");

  console.log("Regex:", regex);

  const found = await ProductModel.countDocuments({ magentoCategories: { $regex: regex } });
  console.log(`Found ${found} matching magentoCategories in product.service.ts logic`);

  const foundValidator = await ProductModel.countDocuments({
    $or: [
      { magentoCategories: /modular/i },
      { name: /modular/i },
    ],
    name: { $not: /\b(visor|pinlock|spoiler|deflector|pad|screw|lock)\b/i }
  });
  console.log(`Found ${foundValidator} matching in product.validator.ts logic`);

  mongoose.disconnect();
}
check().catch(console.error);
