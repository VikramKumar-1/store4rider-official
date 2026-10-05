import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

const phoneValidation = z.string().optional().refine((val) => {
  if (!val) return true;
  try {
    return isValidPhoneNumber(val);
  } catch (e) {
    return false;
  }
}, "Invalid phone number length or format for this country");

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

const addressRegex = /^[a-zA-Z0-9\s\-,.'/#]+$/;
const addressMessage = "Can only contain letters, numbers, spaces, and basic punctuation (-,.'/#)";

export const addressSchema = z.object({
  street: z.string().min(3).max(255).regex(addressRegex, addressMessage),
  city: z.string().min(2).max(100).regex(addressRegex, addressMessage),
  state: z.string().min(2).max(100).regex(addressRegex, addressMessage),
  pincode: z.string().regex(/^[a-zA-Z0-9\s-]{3,10}$/, "Invalid postal code format"),
  country: z.string().min(2).max(100).regex(addressRegex, addressMessage),
  isDefault: z.boolean().default(false),
});

const nameRegex = /^[a-zA-Z\s\-']+$/;
const nameMessage = "Name can only contain letters, spaces, hyphens, and apostrophes";

export const registerSchema = z.object({
  email: z.string().email().max(255, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters long").max(100, "Password is too long"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long").regex(nameRegex, nameMessage),
  lastName: z.string().max(50, "Last name is too long").regex(nameRegex, nameMessage).optional().or(z.literal('')),
  phone: phoneValidation,
});

export const loginSchema = z.object({
  email: z.string().email().max(255, "Email is too long"),
  password: z.string().min(1, "Password is required").max(100, "Password is too long"),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).regex(nameRegex, nameMessage).optional(),
  lastName: z.string().max(50).regex(nameRegex, nameMessage).optional().or(z.literal('')),
  phone: phoneValidation,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
