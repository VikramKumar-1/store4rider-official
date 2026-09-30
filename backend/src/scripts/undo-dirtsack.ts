import "dotenv/config";
import mongoose from "mongoose";

async function undoDirtSack() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    // Hide those specific DirtSack products again
    const result = await ProductModel.updateMany(
      { sku: { $in: ["DG3HB", "TSHD"] } }, // DirtSack DG 3 and Thermotect SKUs
      { $set: { status: "archived" } }
    );

    console.log(`✅ SUCCESS! ${result.modifiedCount} DirtSack products wapas 'archived' kar diye gaye hain.`);
    console.log(`Ab Biking Brotherhood ke Kit mein wapas 2 hi items dikhenge.`);
    
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
undoDirtSack();
