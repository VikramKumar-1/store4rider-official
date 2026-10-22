import { updateSettingSchema } from "@store4riders/shared-validation";
import { AppError } from "../../core/errors/AppError";

export class SettingValidator {
  static async validateUpdateSettings(req: any) {
    let body = (req as any).parsedBody;
    if (!body) {
      if (typeof req.json === "function") {
        body = await req.json();
      } else {
        body = (req as any).body;
      }
      (req as any).parsedBody = body;
    }
    const result = updateSettingSchema.safeParse(body);
    if (!result.success) {
      throw new AppError(result.error.errors[0].message, 400);
    }
    return result.data;
  }
}
