/**
 * @file homepage.controller.ts
 * @description HTTP Controller handling requests for Homepage & SEO configuration.
 */
import { HomepageService } from "./homepage.service";
import { HomepageValidator } from "./homepage.validator";
import { ApiResponse } from "../../core/response/ApiResponse";

export class HomepageController {
  /**
   * Public endpoint to fetch active homepage settings (cached).
   */
  static async getPublic(req: any) {
    const config = await HomepageService.getPublicConfig();
    return ApiResponse.success(config, "Homepage configuration fetched successfully");
  }

  /**
   * Admin endpoint to fetch full homepage settings.
   */
  static async getAdmin(req: any) {
    const config = await HomepageService.getAdminConfig();
    return ApiResponse.success(config, "Admin homepage configuration retrieved");
  }

  /**
   * Admin endpoint to update Hero & SEO settings.
   */
  static async updateHeroAndSeo(req: any) {
    const validatedData = await HomepageValidator.validateUpdateHeroAndSeo(req);
    const { hero, seo } = validatedData;
    const updated = await HomepageService.updateHeroAndSeo(hero, seo);
    return ApiResponse.success(updated, "Hero and SEO updated successfully");
  }

  /**
   * Admin endpoint to update homepage sections (titles, categories, reels, etc.).
   */
  static async updateSections(req: any) {
    const validatedData = await HomepageValidator.validateUpdateSections(req);
    const { sections } = validatedData;
    const updated = await HomepageService.updateSections(sections);
    return ApiResponse.success(updated, "Homepage sections updated successfully");
  }

  /**
   * Admin endpoint to update full homepage configuration.
   */
  static async updateConfig(req: any) {
    const validatedData = await HomepageValidator.validateUpdateConfig(req);
    const updated = await HomepageService.updateConfig(validatedData);
    return ApiResponse.success(updated, "Homepage configuration updated successfully");
  }
}
