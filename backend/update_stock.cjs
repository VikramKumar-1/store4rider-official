require("dotenv").config();
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const ProductModel = mongoose.connection.collection("products");
    
    // Add a dummy variant to the test product so the frontend sees it in stock!
    await ProductModel.updateOne(
      { sku: "TEST-JKT-PRO-001" },
      {
        $set: {
          productType: "configurable",
          variants: [
            {
              id: "v1",
              sku: "TEST-JKT-PRO-001-L",
              price: 5000,
              specialPrice: 4500,
              stock: 10,
              attributes: { size: "L", color: "Black" }
            }
          ]
        }
      }
    );
    console.log("Updated test product with stock variant!");
  } catch (error) {
    console.error("Error updating:", error);
  } finally {
    await mongoose.disconnect();
  }
}
run();
