/**
 * @file homepage.repository.ts
 * @description Direct database access layer for Homepage Configuration.
 * Ensures a singleton homepage configuration document in MongoDB.
 */
import { HomepageModel } from "./homepage.model";
import {
  IHomepageConfig,
  IHeroSectionConfig,
  IHomepageSeoConfig,
  IHomepageSectionsConfig,
} from "@store4riders/shared-types";
import { ClientSession } from "mongoose";

export class HomepageRepository {
  /**
   * Fetches the singleton homepage config.
   * Creates default config if none exists.
   */
  static async getConfig(): Promise<IHomepageConfig> {
    let doc = await HomepageModel.findOne().lean<IHomepageConfig>().exec();
    if (!doc) {
      const created = await HomepageModel.create({});
      doc = created.toObject() as IHomepageConfig;
    }
    return doc;
  }

  /**
   * Updates hero and SEO configuration.
   */
  static async updateHeroAndSeo(
    hero: IHeroSectionConfig,
    seo: IHomepageSeoConfig,
    session?: ClientSession
  ): Promise<IHomepageConfig> {
    let doc = await HomepageModel.findOne().session(session || null);
    if (!doc) {
      doc = new HomepageModel({});
    }
    doc.hero = hero;
    doc.seo = seo;
    await doc.save({ session });
    return doc.toObject() as IHomepageConfig;
  }

  /**
   * Updates homepage sections configuration.
   */
  static async updateSections(
    sections: IHomepageSectionsConfig,
    session?: ClientSession
  ): Promise<IHomepageConfig> {
    let doc = await HomepageModel.findOne().session(session || null);
    if (!doc) {
      doc = new HomepageModel({});
    }
    doc.sections = sections;
    doc.markModified("sections");
    doc.markModified("sections.socialMedia");
    await doc.save({ session });
    return doc.toObject() as IHomepageConfig;
  }

  /**
   * Updates full homepage configuration.
   */
  static async updateConfig(
    data: Partial<IHomepageConfig>,
    session?: ClientSession
  ): Promise<IHomepageConfig> {
    let doc = await HomepageModel.findOne().session(session || null);
    if (!doc) {
      doc = new HomepageModel({});
    }
    if (data.hero) doc.hero = data.hero;
    if (data.seo) doc.seo = data.seo;
    if (data.sections) doc.sections = data.sections;
    await doc.save({ session });
    return doc.toObject() as IHomepageConfig;
  }
}
