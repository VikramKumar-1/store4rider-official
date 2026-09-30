import "dotenv/config";
import mongoose from "mongoose";

async function findPerfectProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    // Get all products with related and upsell skus
    const products = await ProductModel.find({
      relatedSkus: { $exists: true, $not: { $size: 0 } },
      upsellSkus: { $exists: true, $not: { $size: 0 } },
      status: "published",
      stockStatus: 1
    }).lean().exec();

    console.log(`Checking ${products.length} products to find a perfect match...`);

    for (const p of products) {
      const relatedCount = await ProductModel.countDocuments({ sku: { $in: p.relatedSkus }, status: "published", stockStatus: 1 });
      const upsellCount = await ProductModel.countDocuments({ sku: { $in: p.upsellSkus }, status: "published", stockStatus: 1 });

      if (relatedCount > 0 && upsellCount > 0) {
        console.log("✅ FOUND PERFECT PRODUCT!");
        console.log("Name:", p.name);
        console.log("Slug:", p.slug);
        console.log(`- Kit me ${relatedCount} products ayenge`);
        console.log(`- Upsell me ${upsellCount} products ayenge`);
        break;
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
findPerfectProduct();
