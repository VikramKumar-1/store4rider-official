import "dotenv/config";
import mongoose from "mongoose";

async function publishAllInStock() {
  try {
    console.log("🔌 Connecting to DB...");
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    // Update all products that are not 'published' but have stockStatus = 1 (In Stock)
    const result = await ProductModel.updateMany(
      { stockStatus: 1, status: { $ne: "published" } },
      { $set: { status: "published" } }
    );

    console.log(`✅ SUCCESS!`);
    console.log(`Zabardasti "published" mark kiye gaye products: ${result.modifiedCount}`);
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
publishAllInStock();
