import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "backend/.env" });
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/store4riders";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const ProductModel = mongoose.model("Product", new mongoose.Schema({}, { strict: false, collection: "products" }));

  const modular = await ProductModel.find({
    $or: [
      { magentoCategories: /modular/i },
      { name: /modular/i }
    ],
    name: { $not: /\b(visor|pinlock|spoiler|deflector|pad|screw|lock)\b/i }
  }).select("name magentoCategories").lean();

  console.log(`Found ${modular.length} modular helmets.`);
  if (modular.length > 0) {
    console.log(modular.slice(0, 3).map((m: any) => m.name));
  } else {
    // If none found, what are they called?
    const flipup = await ProductModel.find({
      $or: [
        { magentoCategories: /flip/i },
        { name: /flip/i }
      ]
    }).select("name magentoCategories").lean();
    console.log(`Found ${flipup.length} flip-up helmets.`);
    if (flipup.length > 0) console.log(flipup.slice(0, 3).map((m: any) => m.name));
  }

  mongoose.disconnect();
}
check().catch(console.error);
