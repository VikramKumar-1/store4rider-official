import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().min(1, "Please select at least 1 star").max(5, "Rating cannot exceed 5 stars"),
  comment: z.string().min(3, "Review must be at least 3 characters").max(1000, "Review cannot exceed 1000 characters"),
  userName: z.string().min(1, "Name is required").max(100).optional(),
  userEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  city: z.string().min(2, "City is required (minimum 2 characters)").max(80, "City cannot exceed 80 characters"),
  title: z.string().max(150, "Title cannot exceed 150 characters").optional(),
  website: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});
