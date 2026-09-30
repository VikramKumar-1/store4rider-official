import "dotenv/config";
import mongoose from "mongoose";

async function fixPrice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    const result = await ProductModel.updateOne(
      { sku: "RVPPBLU" },
      { 
        $set: { 
          basePrice: 1700,
          "variants.$[].price": 1700 
        } 
      }
    );

    console.log("✅ Fixed Rynox Price to ₹1700!");
    console.log(`Modified: ${result.modifiedCount} document(s)`);

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
fixPrice();
