/**
 * @file homepage.service.ts
 * @description Core business logic for Homepage & SEO configuration.
 * Coordinates database retrieval via Repository and manages Redis caching.
 */
import { HomepageRepository } from "./homepage.repository";
import {
  IHomepageConfig,
  IHeroSectionConfig,
  IHomepageSeoConfig,
  IHomepageSectionsConfig,
} from "@store4riders/shared-types";
import { getCache, setCache, deleteCache } from "@/core/cache/redis";
import { logger } from "@/core/utils/logger";

const HOMEPAGE_CACHE_KEY = "cache:homepage:config";
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour

export class HomepageService {
  /**
   * Fetches public homepage configuration with caching.
   */
  static async getPublicConfig(): Promise<IHomepageConfig> {
    try {
      const cached = await getCache(HOMEPAGE_CACHE_KEY);
      if (cached) {
        return this.normalizeConfig(cached);
      }
    } catch (err) {
      logger.warn("Redis error on homepage config getCache:", err);
    }

    const config = await HomepageRepository.getConfig();
    const normalized = this.normalizeConfig(config);

    try {
      await setCache(HOMEPAGE_CACHE_KEY, normalized, HOMEPAGE_CACHE_TTL);
    } catch (err) {
      logger.warn("Redis error on homepage config setCache:", err);
    }

    return normalized;
  }

  /**
   * Fetches full configuration for the admin panel.
   */
  static async getAdminConfig(): Promise<IHomepageConfig> {
    const config = await HomepageRepository.getConfig();
    return this.normalizeConfig(config);
  }

  /**
   * Normalizes legacy or default category destination URLs to canonical paths.
   */
  private static normalizeConfig(config: IHomepageConfig): IHomepageConfig {
    if (!config) return config;
    if (config.sections?.featuredCategories?.gloves) {
      const glovesUrl = config.sections.featuredCategories.gloves.linkUrl;
      if (
        !glovesUrl ||
        glovesUrl === "/gloves" ||
        glovesUrl === "/riding-gloves" ||
        glovesUrl === "/riding-gear/motorcycle-riding-gloves"
      ) {
        config.sections.featuredCategories.gloves.linkUrl = "/riding-gear/riding-gloves";
      }
    }
    return config;
  }

  /**
   * Updates Hero and SEO configuration.
   */
  static async updateHeroAndSeo(
    hero: IHeroSectionConfig,
    seo: IHomepageSeoConfig
  ): Promise<IHomepageConfig> {
    const updated = await HomepageRepository.updateHeroAndSeo(hero, seo);
    await this.invalidateCache();
    logger.info("Homepage Hero & SEO updated successfully");
    return updated;
  }

  /**
   * Updates Homepage sections configuration (titles, cards, reels, etc.).
   */
  static async updateSections(
    sections: IHomepageSectionsConfig
  ): Promise<IHomepageConfig> {
    const updated = await HomepageRepository.updateSections(sections);
    await this.invalidateCache();
    logger.info("Homepage Sections updated successfully");
    return updated;
  }

  /**
   * Updates full homepage configuration.
   */
  static async updateConfig(
    data: Partial<IHomepageConfig>
  ): Promise<IHomepageConfig> {
    const updated = await HomepageRepository.updateConfig(data);
    await this.invalidateCache();
    logger.info("Full Homepage config updated successfully");
    return updated;
  }

  /**
   * Invalidate Redis cache.
   */
  private static async invalidateCache(): Promise<void> {
    try {
      await deleteCache(HOMEPAGE_CACHE_KEY);
    } catch (err) {
      logger.warn("Failed to delete homepage cache:", err);
    }
  }
}
