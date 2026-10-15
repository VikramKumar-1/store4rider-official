/**
 * @file homepage.validator.ts
 * @description Zod validation for Homepage and SEO configuration endpoints.
 */
import {
  updateHeroAndSeoSchema,
  updateHomepageSectionsSchema,
  updateHomepageConfigSchema,
} from "@store4riders/shared-validation";
import { ValidationError } from "../../core/errors/AppError";

export class HomepageValidator {
  /**
   * Validates Hero and SEO payload.
   */
  static async validateUpdateHeroAndSeo(req: any) {
    const body = await req.json();
    const result = updateHeroAndSeoSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message || "Invalid Hero and SEO payload");
    }
    return result.data;
  }

  /**
   * Validates Sections payload.
   */
  static async validateUpdateSections(req: any) {
    const body = await req.json();
    const result = updateHomepageSectionsSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message || "Invalid sections payload");
    }
    return result.data;
  }

  /**
   * Validates full configuration payload.
   */
  static async validateUpdateConfig(req: any) {
    const body = await req.json();
    const result = updateHomepageConfigSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0]?.message || "Invalid homepage configuration payload");
    }
    return result.data;
  }
}
