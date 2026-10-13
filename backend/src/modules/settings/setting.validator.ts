import { updateSettingSchema } from "@store4riders/shared-validation";
import { AppError } from "../../core/errors/AppError";

export class SettingValidator {
  static validateUpdateSettings(req: any) {
    const result = updateSettingSchema.safeParse(req.body);
    if (!result.success) {
      throw new AppError(result.error.errors[0].message, 400);
    }
    req.body = result.data;
  }
}
