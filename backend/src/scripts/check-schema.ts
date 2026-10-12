import "dotenv/config";
import mongoose from "mongoose";

async function checkSample() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    // Get a sample product that likely has colors/gender
    const products = await ProductModel.find({ attributes: { $exists: true, $ne: {} } }).limit(5).lean().exec();
    console.log("Found products with attributes:", products.length);
    for (const p of products) {
      console.log(`Product: "${p.name}" (SKU: ${p.sku})`);
      console.log("  Attributes:", p.attributes);
      console.log("  Variants:", p.variants?.map((v: any) => ({ sku: v.sku, attributes: v.attributes, price: v.price })));
    }
    
    // Also check sample configurable product
    const conf = await ProductModel.findOne({ productType: "configurable" }).lean().exec();
    if (conf) {
      console.log(`Configurable: "${conf.name}"`);
      console.log("  Configurable Variations:", conf.configurableVariations);
      console.log("  Attributes:", conf.attributes);
      console.log("  Variants:", conf.variants?.map((v: any) => ({ sku: v.sku, attributes: v.attributes, price: v.price })));
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
checkSample();
