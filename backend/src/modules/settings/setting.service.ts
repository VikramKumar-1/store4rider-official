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
      heroTitle: settings.brandsHeroTitle || "Shop By Brand",
      heroDescription:
        settings.brandsHeroDescription ||
        "Store4Riders is an online multi-brand riding gear store launched in 2016 for fellow riders looking out for quality motorcycle riding gear. We house brands ranging from premium brands to more affordable riding gear brands like etc. Other than riding gear, we offer a host of accessories, luggage and performance parts for bike riders. We deliver all products across India. Check out the brands we have on offer.",
    };
  }

  static async updateBrandsPageSeo(seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    heroTitle?: string;
    heroDescription?: string;
  }) {
    const updateData: any = {};
    if (seo.metaTitle !== undefined) updateData.brandsMetaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) updateData.brandsMetaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) updateData.brandsMetaKeywords = seo.metaKeywords;
    if (seo.heroTitle !== undefined) updateData.brandsHeroTitle = seo.heroTitle;
    if (seo.heroDescription !== undefined) updateData.brandsHeroDescription = seo.heroDescription;
    return SettingRepository.updateSettings(updateData);
  }

  static async getGuidesPageSeo() {
    const settings = await SettingRepository.getSettings();
    return {
      metaTitle: settings.guidesMetaTitle || "",
      metaDescription: settings.guidesMetaDescription || "",
      metaKeywords: settings.guidesMetaKeywords || "",
      heroTitle: settings.guidesHeroTitle || "Motorcycle Guides & Expert Advice",
      heroDescription: settings.guidesHeroDescription || "Real-world gear tests, sizing walkthroughs, maintenance checklists, and touring preparation guides curated by riders for Indian roads and conditions.",
    };
  }

  static async updateGuidesPageSeo(seo: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    heroTitle?: string;
    heroDescription?: string;
  }) {
    const updateData: any = {};
    if (seo.metaTitle !== undefined) updateData.guidesMetaTitle = seo.metaTitle;
    if (seo.metaDescription !== undefined) updateData.guidesMetaDescription = seo.metaDescription;
    if (seo.metaKeywords !== undefined) updateData.guidesMetaKeywords = seo.metaKeywords;
    if (seo.heroTitle !== undefined) updateData.guidesHeroTitle = seo.heroTitle;
    if (seo.heroDescription !== undefined) updateData.guidesHeroDescription = seo.heroDescription;
    return SettingRepository.updateSettings(updateData);
  }
}
