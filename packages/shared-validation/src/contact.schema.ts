import { z } from "zod";

export const contactCategoryEnum = z.enum([
  "order_issue",
  "payment_issue",
  "return_exchange",
  "product_sizing",
  "shipping_delay",
  "other",
]);

export const contactStatusEnum = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const contactPriorityEnum = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

export const createContactIssueSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please provide a valid email address").max(150),
  phone: z.string().optional().refine((val) => !val || /^[0-9+ -]{7,15}$/.test(val), {
    message: "Invalid phone number format",
  }),
  orderNumber: z.string().max(50).optional(),
  category: contactCategoryEnum.default("order_issue"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().min(10, "Please provide detailed description (at least 10 characters)").max(2000),
});

export const updateContactIssueStatusSchema = z.object({
  status: contactStatusEnum,
  note: z.string().max(1000).optional(),
});

export const addContactIssueNoteSchema = z.object({
  text: z.string().min(1, "Note cannot be empty").max(1000),
});

export type CreateContactIssueInput = z.infer<typeof createContactIssueSchema>;
export type UpdateContactIssueStatusInput = z.infer<typeof updateContactIssueStatusSchema>;
export type AddContactIssueNoteInput = z.infer<typeof addContactIssueNoteSchema>;
