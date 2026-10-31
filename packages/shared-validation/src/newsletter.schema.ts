import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(100),
  source: z.string().trim().max(50).optional().default("footer"),
});

export const unsubscribeNewsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(100),
  token: z.string().trim().optional(),
});

export type SubscribeNewsletterInput = z.infer<typeof subscribeNewsletterSchema>;
export type UnsubscribeNewsletterInput = z.infer<typeof unsubscribeNewsletterSchema>;
