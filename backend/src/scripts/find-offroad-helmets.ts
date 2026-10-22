import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import mongoose from "mongoose";

async function run() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri!);
  const helmetProducts = await mongoose.connection.collection("products").find({
    $or: [
      { name: /helmet/i },
      { categorySlugs: "motorcycle-helmets" },
      { categorySlugs: "helmets" },
      { magentoCategories: /helmet/i }
    ]
  }).project({ name: 1, categorySlugs: 1, magentoCategories: 1 }).toArray();

  console.log("Total helmet products:", helmetProducts.length);

  const offroad = helmetProducts.filter(p => 
    /off[\s-]*road|motocross|mx|dirt|dual[\s-]*sport/i.test(p.name) ||
    /off[\s-]*road|motocross/i.test(p.magentoCategories || "") ||
    p.categorySlugs?.some((s: string) => /off[\s-]*road|motocross/i.test(s))
  );

  console.log("Off-road helmet products count:", offroad.length);
  offroad.slice(0, 15).forEach(p => {
    console.log(" - " + p.name);
    console.log("   categorySlugs:", p.categorySlugs);
    console.log("   magentoCategories:", p.magentoCategories);
  });
  await mongoose.disconnect();
}
run();
