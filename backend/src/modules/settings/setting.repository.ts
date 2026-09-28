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
      settings = await SettingModel.create({
        enabledGateways: ["upi", "payu", "ccavenue", "snapmint", "cod"]
      });
    } else if (!settings.enabledGateways || settings.enabledGateways.length < 3) {
      settings.enabledGateways = ["upi", "payu", "ccavenue", "snapmint", "cod"];
      await settings.save();
    }
    if (settings.codPartialPaymentEnabled === undefined) {
      settings.codPartialPaymentEnabled = false;
      await settings.save();
    }
    
    // Add default presets to older database records
    if (!settings.packagePresets || settings.packagePresets.length === 0) {
      settings.packagePresets = [
        { name: "Small Box (Accessories)", length: 15, breadth: 15, height: 10 },
        { name: "Medium Box (Jackets/Boots)", length: 30, breadth: 30, height: 15 },
        { name: "Large Box (Helmets)", length: 40, breadth: 30, height: 30 }
      ] as any;
      await settings.save();
    }
    
    return settings;
  }

  static async updateSettings(data: Partial<ISetting>): Promise<ISetting> {
    const settings = await this.getSettings();
    Object.assign(settings, data);
    return await settings.save();
  }
}
