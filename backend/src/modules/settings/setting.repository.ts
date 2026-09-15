/**
 * @class SettingRepository
 * @description Direct database access layer for Store Settings.
 * Ensures only a single global settings document exists.
 */
import { SettingModel, ISetting } from "./setting.model";

export class SettingRepository {
  static async getSettings(): Promise<ISetting> {
    let settings = await SettingModel.findOne();
    if (!settings) {
      settings = await SettingModel.create({});
    }
    return settings;
  }

  static async updateSettings(data: Partial<ISetting>): Promise<ISetting> {
    const settings = await this.getSettings();
    Object.assign(settings, data);
    return await settings.save();
  }
}
