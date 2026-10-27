import { SettingRepository } from "./setting.repository";
import { AppError } from "../../core/errors/AppError";

export class SettingService {
  /**
   * For the Admin UI: Returns settings
   */
  static async getSettings() {
    return SettingRepository.getSettings();
  }

  /**
   * Saves settings from Admin UI
   */
  static async updateSettings(data: any) {
    return SettingRepository.updateSettings(data);
  }

  static async getBrandsPageSeo() {
    const settings = await SettingRepository.getSettings();
    return {
      metaTitle: settings.brandsMetaTitle || "",
      metaDescription: settings.brandsMetaDescription || "",
      metaKeywords: settings.brandsMetaKeywords || "",
    };
  }

  static async updateBrandsPageSeo(seo: { metaTitle?: string; metaDescription?: string; metaKeywords?: string }) {
    const updateData: any = {};
    if (seo.metaTitle !== undefined) updateData.brandsMetaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) updateData.brandsMetaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) updateData.brandsMetaKeywords = seo.metaKeywords;
    return SettingRepository.updateSettings(updateData);
  }

  static async getGuidesPageSeo() {
    const settings = await SettingRepository.getSettings();
    return {
      metaTitle: settings.guidesMetaTitle || "",
      metaDescription: settings.guidesMetaDescription || "",
      metaKeywords: settings.guidesMetaKeywords || "",
    };
  }

  static async updateGuidesPageSeo(seo: { metaTitle?: string; metaDescription?: string; metaKeywords?: string }) {
    const updateData: any = {};
    if (seo.metaTitle !== undefined) updateData.guidesMetaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) updateData.guidesMetaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) updateData.guidesMetaKeywords = seo.metaKeywords;
    return SettingRepository.updateSettings(updateData);
  }
}
