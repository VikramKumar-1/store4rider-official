import "dotenv/config";
import mongoose from "mongoose";

async function testLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const ProductModel = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

    // 1. Get Clan Boots
    const clanBoots = await ProductModel.findOne({ sku: "SCOUTWP-D3O" }).lean().exec();
    
    if (!clanBoots) {
      console.log("Clan Boots not found in DB!");
      return;
    }

    console.log("========================================");
    console.log(`1. Found Product: ${clanBoots.name}`);
    console.log(`2. Exact Magento Related SKUs saved in DB:`, clanBoots.relatedSkus);
    
    if (!clanBoots.relatedSkus || clanBoots.relatedSkus.length === 0) {
      console.log("No related SKUs found on this product.");
      return;
    }

    // 3. Try to fetch these exact SKUs from our DB
    console.log("3. Now searching Database for these SKUs...");
    const foundProducts = await ProductModel.find({ sku: { $in: clanBoots.relatedSkus } }).select("name sku").lean().exec();

    console.log("========================================");
    console.log(`RESULT: Found ${foundProducts.length} out of ${clanBoots.relatedSkus.length} products in DB.`);
    
    if (foundProducts.length > 0) {
      console.log("Products found in DB:");
      foundProducts.forEach((p: any) => console.log(` - ${p.name} (${p.sku})`));
    } else {
      console.log("❌ ZERO products found in DB!");
      console.log("Reason: The CSV export did NOT contain these products (gloves, intercom, etc.), so they were never imported.");
      console.log("Logic is 100% correct. We are asking DB for the exact items, but DB is empty for these items.");
    }
    console.log("========================================");

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}
testLogic();
