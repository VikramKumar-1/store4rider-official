/**
 * @file homepage.controller.ts
 * @description HTTP Controller handling requests for Homepage & SEO configuration.
 */
import { NextResponse } from "next/server";
import { HomepageService } from "./homepage.service";
import { HomepageValidator } from "./homepage.validator";
import { ApiResponse } from "../../core/response/ApiResponse";
import { logger } from "../../core/utils/logger";

export class HomepageController {
  /**
   * Public endpoint to fetch active homepage settings (cached).
   */
  static async getPublic(req: any) {
    try {
      const url = new URL(req.url);
      if (url.searchParams.get("refresh") === "true") {
        await HomepageService.invalidateCache();
      }
    } catch {
      // Ignore URL parse error
    }
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

  /**
   * Admin endpoint to sync live Instagram Reels and Account Stats.
   */
  static async syncInstagram(req: any) {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const updated = await HomepageService.syncInstagramFeed(body?.accessToken, body?.accountId);
    return ApiResponse.success(updated, "Instagram feed synced successfully");
  }

  /**
   * Meta Real-Time Webhook (GET handshake verification + POST real-time post trigger).
   */
  static async handleWebhook(req: any) {
    const method = req.method;
    const url = new URL(req.url);

    if (method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "store4riders_meta_token";

      if (mode === "subscribe" && token === verifyToken) {
        return new NextResponse(challenge || "", { status: 200, headers: { "Content-Type": "text/plain" } });
      }
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (method === "POST") {
      try {
        logger.info("Instagram Real-Time Webhook received from Meta. Triggering live sync...");
        await HomepageService.syncInstagramFeed();
      } catch (err: any) {
        logger.warn("Webhook triggered sync failed:", { error: err.message });
      }
      return ApiResponse.success({ received: true }, "Instagram webhook processed");
    }

    return ApiResponse.error("Method not allowed", 405);
  }
}
