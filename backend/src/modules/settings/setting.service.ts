import { SettingRepository } from "./setting.repository";
import { AppError } from "../../core/errors/AppError";

export class SettingService {
  static async getSettings() {
    return SettingRepository.getSettings();
  }

  static async updateSettings(data: any) {
    return SettingRepository.updateSettings(data);
  }
}
