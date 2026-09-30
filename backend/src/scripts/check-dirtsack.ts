import "dotenv/config";
import mongoose from "mongoose";

async function checkDirtSack() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    const product = await ProductModel.findOne({ name: { $regex: "DirtSack Long Ranger", $options: "i" } }).lean().exec();
    
    if (product) {
      console.log("✅ FOUND IN DATABASE!");
      console.log("Name:", product.name);
      console.log("SKU:", product.sku);
      console.log("Stock Status:", product.stockStatus === 1 ? "In Stock (1)" : `Out of Stock (${product.stockStatus})`);
      console.log("Price:", product.basePrice);
      console.log("Status:", product.status); // "published" or "draft"
    } else {
      console.log("❌ NOT FOUND IN DATABASE");
      console.log("Agar ye CSV mein hai, toh sayad uski Row format mein koi dikkat thi jiske karan import fail ho gaya.");
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkDirtSack();
