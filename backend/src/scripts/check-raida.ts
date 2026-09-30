import "dotenv/config";
import mongoose from "mongoose";

async function checkRaida() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    const product = await ProductModel.findOne({ name: { $regex: "Raida Explorer", $options: "i" } }).lean().exec();
    
    if (product) {
      console.log("✅ Found:", product.name);
      console.log("SKU:", product.sku);
      console.log("relatedSkus:", product.relatedSkus);
      console.log("upsellSkus:", product.upsellSkus);
      
      const related = await ProductModel.find({ sku: { $in: product.relatedSkus } }).select("name sku").lean().exec();
      console.log("\nProducts in DB from relatedSkus:");
      related.forEach((p: any) => console.log(`- ${p.name} (${p.sku})`));

      const upsell = await ProductModel.find({ sku: { $in: product.upsellSkus } }).select("name sku").lean().exec();
      console.log("\nProducts in DB from upsellSkus:");
      upsell.forEach((p: any) => console.log(`- ${p.name} (${p.sku})`));
      
    } else {
      console.log("❌ Not found");
    }

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkRaida();
