import "dotenv/config";
import mongoose from "mongoose";

async function checkSample() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    // Get a sample product that likely has colors/gender
    const product = await ProductModel.findOne({ 
      magentoCategories: { $regex: "Jacket|Helmet|Boots", $options: "i" } 
    }).lean().exec();

    console.log("Sample Product Extracted:");
    console.log("- Name:", product.name);
    console.log("- Brand:", product.brand);
    console.log("- Categories:", product.magentoCategories);
    console.log("- Variants Attributes:", JSON.stringify(product.variants?.map((v:any) => v.attributes), null, 2));
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkSample();
