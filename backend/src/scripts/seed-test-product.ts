import mongoose from "mongoose";
import { config } from "dotenv";
import { ProductModel } from "../modules/product/product.model.js"; // Note: Added .js for ESM

config(); // Loads .env from the current working directory (backend/)

async function seedTestProduct() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to DB");

    const testProductId = "6abfc271ee164cac7ce12a22";

    // check if it exists
    const existing = await ProductModel.findById(testProductId);
    if (existing) {
      console.log("Test product already exists. Replenishing stock.");
      await ProductModel.updateOne(
        { _id: testProductId },
        { 
          $set: { stockStatus: 1 },
          $inc: { "variants.$[].stock": 100 }
        }
      );
    } else {
      console.log("Creating test product...");
      await ProductModel.create({
        _id: new mongoose.Types.ObjectId(testProductId),
        name: "Test Checkout Product",
        slug: "test-checkout-product",
        sku: "TEST-CHECKOUT-SKU",
        basePrice: 10,
        specialPrice: 10,
        description: "A test product for checkout flow so real stock is not affected.",
        shortDescription: "Test product",
        categoryId: new mongoose.Types.ObjectId(),
        stockStatus: 1,
        productType: "simple",
        isActive: true,
        isPublished: true,
        taxClassName: "standard",
        images: [
          {
            id: "img1",
            url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=75&w=600&auto=format&fit=crop",
            altText: "Test Image"
          }
        ],
        variants: [
          {
            id: "var-1",
            sku: "TEST-CHECKOUT-SKU-VAR",
            price: 10,
            specialPrice: 10,
            stock: 99999,
            attributes: { size: "Universal" }
          }
        ]
      });
    }

    console.log("Seeding complete. Test Product ID:", testProductId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedTestProduct();
