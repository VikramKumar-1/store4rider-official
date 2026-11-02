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
    const doc = await HomepageModel.findOneAndUpdate(
      {},
      {
        $set: {
          hero,
          seo,
        },
      },
      { new: true, upsert: true, session: session || null, runValidators: false }
    )
      .lean<IHomepageConfig>()
      .exec();

    return doc as IHomepageConfig;
  }

  /**
   * Updates homepage sections configuration.
   */
  static async updateSections(
    sections: IHomepageSectionsConfig,
    session?: ClientSession
  ): Promise<IHomepageConfig> {
    const doc = await HomepageModel.findOneAndUpdate(
      {},
      {
        $set: {
          sections,
        },
      },
      { new: true, upsert: true, session: session || null }
    )
      .lean<IHomepageConfig>()
      .exec();

    return doc as IHomepageConfig;
  }

  /**
   * Updates full homepage configuration.
   */
  static async updateConfig(
    data: Partial<IHomepageConfig>,
    session?: ClientSession
  ): Promise<IHomepageConfig> {
    const doc = await HomepageModel.findOneAndUpdate(
      {},
      {
        $set: data,
      },
      { new: true, upsert: true, session: session || null }
    )
      .lean<IHomepageConfig>()
      .exec();

    return doc as IHomepageConfig;
  }
}
