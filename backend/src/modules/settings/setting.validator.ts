import { updateSettingSchema } from "@store4riders/shared-validation";
import { AppError } from "../../core/errors/AppError";

export class SettingValidator {
  static async validateUpdateSettings(req: any) {
    const body = await req.json();
    const result = updateSettingSchema.safeParse(body);
    if (!result.success) {
      throw new AppError(result.error.errors[0].message, 400);
    }
    return result.data;
  }
}
