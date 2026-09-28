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
}
