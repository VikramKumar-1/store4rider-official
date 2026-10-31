import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolve } from "path";
import { CouponModel } from "../modules/coupon/coupon.model";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI;

const SAMPLE_COUPONS = [
  {
    code: "WELCOME10",
    description: "10% off on your first purchase (Max ₹1,000 discount)",
    discountType: "percent",
    discountValue: 10,
    maxDiscountCap: 1000,
    minPurchase: 1499,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year valid
    isActive: true,
    scope: "all",
    excludeSaleItems: false,
    firstOrderOnly: true,
    usageLimitPerUser: 1,
    totalUsageLimit: 10000,
    usageCount: 0,
  },
  {
    code: "RIDER500",
    description: "Flat ₹500 off on regular full-price gear above ₹4,999",
    discountType: "fixed",
    discountValue: 500,
    minPurchase: 4999,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isActive: true,
    scope: "all",
    excludeSaleItems: true, // Margin protection: cannot be combined with already discounted items
    firstOrderOnly: false,
    usageLimitPerUser: 1,
    totalUsageLimit: 500,
    usageCount: 0,
  },
  {
    code: "HELMET15",
    description: "15% off on riding helmets (Max ₹1,500 discount)",
    discountType: "percent",
    discountValue: 15,
    maxDiscountCap: 1500,
    minPurchase: 2999,
    startDate: new Date(),
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    isActive: true,
    scope: "category",
    applicableCategories: ["helmets", "modular-helmets", "full-face-helmets"],
    excludeSaleItems: false,
    firstOrderOnly: false,
    usageLimitPerUser: 2,
    totalUsageLimit: 300,
    usageCount: 0,
  },
];

async function seedCoupons() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to Database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to Database");

    for (const data of SAMPLE_COUPONS) {
      const existing = await CouponModel.findOne({ code: data.code });
      if (existing) {
        console.log(`ℹ️  Coupon ${data.code} already exists. Skipping.`);
      } else {
        await CouponModel.create(data);
        console.log(`✅ Seeded Coupon: ${data.code} (${data.discountType === "percent" ? `${data.discountValue}%` : `₹${data.discountValue}`})`);
      }
    }

    console.log("🎉 Coupon seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding coupons:", error);
    process.exit(1);
  }
}

seedCoupons();
