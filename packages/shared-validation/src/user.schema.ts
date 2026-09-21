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
  street: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(4),
  country: z.string().min(2),
  isDefault: z.boolean().default(false),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
