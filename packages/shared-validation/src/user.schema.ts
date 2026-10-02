import { z } from "zod";

const USER_ROLES = [
  "super_admin",
  "admin",
  "product_manager",
  "order_manager",
  "marketing_manager",
  "customer_support",
  "customer"
] as const;

export const userRoleSchema = z.enum(USER_ROLES);

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});

export const addressSchema = z.object({
  street: z.string().min(3).max(255),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^[a-zA-Z0-9\s-]{3,10}$/, "Invalid postal code format"),
  country: z.string().min(2).max(100),
  isDefault: z.boolean().default(false),
});

export const registerSchema = z.object({
  email: z.string().email().max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters long").max(100, "Password is too long"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long"),
  lastName: z.string().max(50, "Last name is too long").optional(),
  phone: z.string().min(4, "Phone number is too short").max(15, "Phone number is too long").optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255, "Email is too long"),
  password: z.string().min(1, "Password is required").max(100, "Password is too long"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().min(4).max(15).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
