import { NextRequest } from "next/server";
import { z } from "zod";
import { AppError } from "../../core/errors/AppError";

const webhookParamsSchema = z.object({
  gateway: z.enum(["payu", "ccavenue", "snapmint"]),
});

export class PaymentValidator {
  
  static validateWebhookParams(params: { gateway: string }) {
    try {
      return webhookParamsSchema.parse(params);
    } catch (error) {
      throw new AppError("Invalid gateway parameter", 400);
    }
  }
}
