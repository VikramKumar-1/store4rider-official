import "dotenv/config";
import mongoose from "mongoose";

async function checkProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    const product = await ProductModel.findOne({ name: { $regex: "Raida Compass S60", $options: "i" } }).lean().exec();
    
    if (product) {
      console.log("✅ FOUND IN DATABASE!");
      console.log("Name:", product.name);
      console.log("SKU:", product.sku);
      console.log("Stock Status:", product.stockStatus === 1 ? "In Stock (1)" : `Out of Stock (${product.stockStatus})`);
      console.log("Price:", product.basePrice);
    } else {
      console.log("❌ NOT FOUND IN DATABASE");
      console.log("Reason: Ye product CSV export mein shamil nahi tha (ya toh disabled tha ya Magento se export nahi hua).");
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkProduct();
