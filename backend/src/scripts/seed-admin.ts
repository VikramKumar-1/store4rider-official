import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { resolve } from "path";
import { OrderModel } from "../modules/order/order.model.js"; // just to trigger mongoose model load if needed

// Ensure env variables are loaded from the backend root
dotenv.config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

// We need the User model schema directly for the script
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: "customer" },
  isActive: { type: Boolean, default: true }
}, { strict: false }); // strict false to allow other fields just in case

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

async function seedAdmin() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env file");
    process.exit(1);
  }

  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to Database");

    const adminEmail = "admin@store4riders.com";
    const adminPassword = "AdminPassword123!";

    const existingAdmin = await UserModel.findOne({ email: adminEmail });

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (existingAdmin) {
      console.log(`Admin user ${adminEmail} already exists. Updating password and role...`);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("✅ Admin password reset successfully.");
    } else {
      console.log(`Creating new admin user ${adminEmail}...`);
      await UserModel.create({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Super",
        lastName: "Admin",
        role: "admin",
        isActive: true
      });
      console.log("✅ Admin user created successfully.");
    }

    console.log("\n-----------------------------------------");
    console.log("🚀 YOU CAN NOW LOGIN WITH:");
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log("-----------------------------------------\n");

  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  }
}

seedAdmin();
