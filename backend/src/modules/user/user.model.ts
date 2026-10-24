import mongoose, { Schema } from "mongoose";
import { IUser, IUserAddress } from "@store4riders/shared-types";

const addressSchema = new Schema<IUserAddress>({
  id: { type: String },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ["super_admin", "admin", "logistic", "customer_care", "product_manager", "order_manager", "marketing_manager", "customer_support", "customer"], default: "customer" },
    isActive: { type: Boolean, default: true },
    addresses: [addressSchema],
    // We add password directly to schema although it's not in IUser type,
    // and we mark it select: false so it doesn't leak.
    password: { type: String, required: true, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  } as any, // Type cast to allow password
  { timestamps: true }
);

// High-performance query indexes
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1, createdAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  delete (mongoose.models as any).User;
}

export const UserModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
