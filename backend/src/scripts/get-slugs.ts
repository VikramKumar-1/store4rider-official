import mongoose from "mongoose";
import dotenv from "dotenv";
import { ProductModel } from "../modules/product/product.model";

dotenv.config();

async function getSlugs() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/store4riders");
  const products = await ProductModel.find({}).select("categorySlugs").lean();
  
  const uniqueSlugs = new Set<string>();
  products.forEach(p => {
    if (p.categorySlugs) {
      p.categorySlugs.forEach((s: string) => uniqueSlugs.add(s));
    }
  });

  console.log(Array.from(uniqueSlugs).sort().join("\n"));
  process.exit(0);
}

getSlugs();
