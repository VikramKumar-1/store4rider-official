import { z } from "zod";
import { AppError } from "../../core/errors/AppError";

export class SettingValidator {
  static validateUpdateSettings(req: any) {
    const schema = z.object({
      taxRate: z.number().min(0).max(100).optional(),
      freeShippingThreshold: z.number().min(0).optional(),
      shippingCost: z.number().min(0).optional(),
      enabledGateways: z.array(z.string()).optional(),
      codPartialPaymentType: z.enum(["percentage", "fixed"]).optional(),
      codPartialPaymentValue: z.number().min(0).optional(),
    });

    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(result.error.errors[0].message, 400);
    }
    req.body = result.data;
  }
}
