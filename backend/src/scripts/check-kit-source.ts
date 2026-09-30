import "dotenv/config";
import mongoose from "mongoose";

async function checkKitSource() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    const product = await ProductModel.findOne({ slug: "biking-brotherhood-saddle-bag" }).lean().exec();
    
    console.log("Original CSV mapped related SKUs:", product.relatedSkus);
    
    // Check status of those SKUs
    for (const sku of product.relatedSkus) {
      const p = await ProductModel.findOne({ sku }).lean().exec();
      console.log(`SKU: ${sku} | Name: ${p?.name} | Status: ${p?.status} | Stock: ${p?.stockStatus}`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkKitSource();
