import "dotenv/config";
import mongoose from "mongoose";

async function checkProduct() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI missing in .env");
    
    await mongoose.connect(uri);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    const product = await ProductModel.findOne({ name: { $regex: "Rynox Vapour Pro Performance Base Layer - Upper", $options: "i" } }).lean().exec();

    if (product) {
      console.log("✅ PRODUCT FOUND IN DB");
      console.log("SKU:", product.sku);
      console.log("Base Price:", product.basePrice);
      console.log("Variants Count:", product.variants?.length || 0);
      if (product.variants?.length > 0) {
        console.log("Variant Prices:", product.variants.map((v: any) => v.price).join(", "));
      }
    } else {
      console.log("❌ Product not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}
checkProduct();
