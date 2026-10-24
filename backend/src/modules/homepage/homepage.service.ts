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
  IInstagramReel,
  ISocialMediaSectionConfig,
} from "@store4riders/shared-types";
import { getCache, setCache, deleteCache } from "@/core/cache/redis";
import { logger } from "@/core/utils/logger";
import { AppError, ValidationError } from "../../core/errors/AppError";

const HOMEPAGE_CACHE_KEY = "cache:homepage:config";
const HOMEPAGE_CACHE_TTL = 3600; // 1 hour
const INSTAGRAM_AUTO_SYNC_TTL = 15 * 60; // 15 minutes (safely within Meta 200 req/hr limit)
const INSTAGRAM_LAST_SYNC_KEY = "cache:instagram:last_synced_at";

function formatCompactCount(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString("en-IN");
}

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
    let normalized = this.normalizeConfig(config);

    // Auto-sync Instagram: if empty or if 6 hours elapsed, sync in background
    if (process.env.INSTAGRAM_ACCESS_TOKEN) {
      const reelsCount = normalized.sections?.socialMedia?.reels?.length || 0;
      if (reelsCount === 0) {
        try {
          logger.info("Instagram reels collection is empty. Auto-syncing from Instagram Graph API...");
          normalized = await this.syncInstagramFeed();
        } catch (err: any) {
          logger.warn("Auto-syncing Instagram feed on empty state failed:", { error: err.message });
        }
      } else {
        // Periodic background check: auto-sync every 6 hours without blocking the user
        getCache(INSTAGRAM_LAST_SYNC_KEY)
          .then((lastSync) => {
            if (!lastSync) {
              setCache(INSTAGRAM_LAST_SYNC_KEY, Date.now(), INSTAGRAM_AUTO_SYNC_TTL);
              logger.info("Auto-syncing Instagram feed in background (6h periodic interval)...");
              this.syncInstagramFeed().catch((err) =>
                logger.warn("Background Instagram auto-sync failed:", { error: err.message })
              );
            }
          })
          .catch(() => {});
      }
    }

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
   * Syncs live Instagram feed (followers count, media count, reels thumbnails, permalinks, likes).
   * Supports both Meta Graph API (business account) and Instagram Basic Display API.
   */
  static async syncInstagramFeed(
    customToken?: string,
    customAccountId?: string
  ): Promise<IHomepageConfig> {
    let token = customToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    let accountId = customAccountId || process.env.INSTAGRAM_ACCOUNT_ID;

    // Dynamic disk fallback if process.env was not hot-reloaded
    if (!token || !accountId) {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const dotenv = await import("dotenv");
        const possibleEnvPaths = [
          path.resolve(process.cwd(), "backend/.env"),
          path.resolve(process.cwd(), ".env"),
          path.resolve(process.cwd(), "../backend/.env"),
        ];
        for (const envPath of possibleEnvPaths) {
          if (fs.existsSync(/*turbopackIgnore: true*/ envPath)) {
            const parsed = dotenv.parse(fs.readFileSync(/*turbopackIgnore: true*/ envPath, "utf-8"));
            if (!token && parsed.INSTAGRAM_ACCESS_TOKEN) {
              token = parsed.INSTAGRAM_ACCESS_TOKEN;
              process.env.INSTAGRAM_ACCESS_TOKEN = token;
            }
            if (!accountId && parsed.INSTAGRAM_ACCOUNT_ID) {
              accountId = parsed.INSTAGRAM_ACCOUNT_ID;
              process.env.INSTAGRAM_ACCOUNT_ID = accountId;
            }
          }
        }
      } catch (err: any) {
        logger.warn("Could not read .env from disk for Instagram sync", { error: err?.message });
      }
    }

    if (!token) {
      throw new ValidationError(
        "Instagram Access Token is required. Please set INSTAGRAM_ACCESS_TOKEN in backend/.env"
      );
    }

    logger.info("Starting Instagram Live Feed & Stats sync...", { hasAccountId: !!accountId });

    let followersCount: string | undefined = undefined;
    let followingCount: string | undefined = undefined;
    let postsCount: string | undefined = undefined;
    let profileAvatarUrl: string | undefined = undefined;
    let username = "store4riders";
    let fetchedReels: IInstagramReel[] = [];

    // 1. Fetch Profile / Account Details (Followers, posts, avatar)
    if (accountId) {
      try {
        const userRes = await fetch(
          `https://graph.facebook.com/v19.0/${accountId}?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography&access_token=${token}`,
          { headers: { Accept: "application/json" } }
        );
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.username) username = userData.username;
          if (userData.profile_picture_url) profileAvatarUrl = userData.profile_picture_url;
          if (userData.followers_count !== undefined) {
            followersCount = formatCompactCount(Number(userData.followers_count));
          }
          if (userData.follows_count !== undefined) {
            followingCount = formatCompactCount(Number(userData.follows_count));
          }
          if (userData.media_count !== undefined) {
            postsCount = Number(userData.media_count).toLocaleString("en-IN");
          }
          logger.info(`Instagram profile fetched for @${username}`, { followersCount, postsCount });
        } else {
          const errData = await userRes.json().catch(() => ({}));
          logger.warn("Failed to fetch Instagram account details from Graph API", errData);
        }
      } catch (err: any) {
        logger.warn("Error fetching Instagram profile", { error: err.message });
      }
    }

    // 2. Fetch Media (Scan up to 100 items to prioritize genuine VIDEO reels)
    const mediaEndpoint = accountId
      ? `https://graph.facebook.com/v19.0/${accountId}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&access_token=${token}&limit=100`
      : `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${token}&limit=100`;

    try {
      const mediaRes = await fetch(mediaEndpoint, { headers: { Accept: "application/json" } });
      if (!mediaRes.ok) {
        const errJson = await mediaRes.json().catch(() => ({}));
        throw new AppError(errJson?.error?.message || "Failed to fetch media from Instagram API", 400);
      }
      const mediaData = await mediaRes.json();
      const items = Array.isArray(mediaData.data) ? mediaData.data : [];

      // Prioritize actual VIDEO media (Reels with direct mp4 stream)
      const videoItems = items.filter((item: any) => item.media_type === "VIDEO" && item.media_url);
      const otherItems = items.filter((item: any) => item.media_type !== "VIDEO");

      // Take all real video reels first, fill up to 20 with recent items
      const combinedItems = [...videoItems, ...otherItems].slice(0, 20);

      fetchedReels = combinedItems.map((item: any, idx: number) => {
        const caption = item.caption ? item.caption.split("\n")[0].slice(0, 100) : `Store4Riders Reel #${idx + 1}`;
        const thumbnail = item.thumbnail_url || item.media_url || "/helmetcat.jpg";
        const likesFormatted = item.like_count !== undefined ? formatCompactCount(Number(item.like_count)) : undefined;
        const isVideo = item.media_type === "VIDEO" || (item.media_url && /\.(mp4|webm)(\?.*)?$/i.test(item.media_url));

        return {
          id: item.id || `ig-${idx}`,
          title: caption,
          thumbnailUrl: thumbnail,
          videoType: (isVideo ? "upload" : "embed") as "upload" | "embed",
          videoUrl: (isVideo && item.media_url) ? item.media_url : (item.permalink || `https://www.instagram.com/p/${item.id}/`),
          instagramUrl: item.permalink || `https://www.instagram.com/${username}/`,
          views: likesFormatted || "Live",
          likes: likesFormatted || "0",
          author: `@${username}`,
          order: idx,
          isActive: true,
        };
      });

      logger.info(`Successfully mapped ${fetchedReels.length} Instagram Reels (${videoItems.length} genuine video reels)`);
    } catch (err: any) {
      logger.error("Error fetching Instagram media", { error: err.message });
      throw new AppError(`Instagram Media Sync failed: ${err.message}`, 400);
    }

    // 3. Update Homepage Sections in Database
    const currentConfig = await HomepageRepository.getConfig();
    const currentSections = currentConfig.sections || ({} as any);
    const existingSocial = currentSections.socialMedia || {};

    const updatedSocial: ISocialMediaSectionConfig = {
      ...existingSocial,
      sectionTitle: existingSocial.sectionTitle || "INSTA REELS",
      instagramHandle: username || existingSocial.instagramHandle || "store4riders",
      instagramProfileUrl: `https://www.instagram.com/${username}/`,
      followersCount: followersCount ?? existingSocial.followersCount ?? "48.5K",
      followingCount: followingCount ?? existingSocial.followingCount ?? "142",
      postsCount: postsCount ?? existingSocial.postsCount ?? "1,280",
      profileAvatarUrl: profileAvatarUrl ?? existingSocial.profileAvatarUrl,
      reels: fetchedReels.length > 0 ? fetchedReels : existingSocial.reels,
      reelImages:
        fetchedReels.length > 0
          ? fetchedReels.map((r) => r.thumbnailUrl).slice(0, 6)
          : existingSocial.reelImages,
      bannerTop: existingSocial.bannerTop || { imageUrl: "", linkUrl: "" },
      bannerBottom: existingSocial.bannerBottom || { imageUrl: "", linkUrl: "" },
    };

    const updatedConfig = await HomepageRepository.updateSections({
      ...currentSections,
      socialMedia: updatedSocial,
    });

    await this.invalidateCache();
    await setCache(INSTAGRAM_LAST_SYNC_KEY, Date.now(), INSTAGRAM_AUTO_SYNC_TTL).catch(() => {});
    return updatedConfig;
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
