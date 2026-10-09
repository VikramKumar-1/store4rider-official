import { connectToDatabase } from "./src/core/database/connection";
import { ProductModel } from "./src/modules/product/product.model";

async function run() {
  await connectToDatabase();
  const flexibleBrand = "raida gears";
  const regex = new RegExp(flexibleBrand, "i");
  const wordRegex = new RegExp(`\\b${flexibleBrand}\\b`, "i");

  const query = {
    $or: [
      { brand: { $regex: regex } },
      { "attributes.brand": { $regex: regex } },
      { name: { $regex: wordRegex } }
    ]
  };

  const count = await ProductModel.countDocuments(query);
  console.log("Found:", count);

  const foundProducts = await ProductModel.find(query).select("name brand stockStatus").limit(5).lean();
  console.log(foundProducts);
  process.exit(0);
}
run();
