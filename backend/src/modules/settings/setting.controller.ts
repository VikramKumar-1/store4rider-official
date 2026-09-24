import { SettingService } from "./setting.service";
import { ApiResponse } from "../../core/response/ApiResponse";

export class SettingController {
  static async getSettings(req: any) {
    const settings = await SettingService.getSettings();
    return ApiResponse.success(settings, "Settings retrieved successfully");
  }

  static async getPublicSettings(req: any) {
    const settings = await SettingService.getSettings();
    // Only return non-sensitive fields
    const publicData = {
      taxRate: settings.taxRate,
      freeShippingThreshold: settings.freeShippingThreshold,
      shippingCost: settings.shippingCost,
      enabledGateways: settings.enabledGateways,
      codPartialPaymentType: settings.codPartialPaymentType,
      codPartialPaymentValue: settings.codPartialPaymentValue
    };
    return ApiResponse.success(publicData, "Public settings retrieved successfully");
  }

  static async updateSettings(req: any) {
    const settings = await SettingService.updateSettings(req.body);
    return ApiResponse.success(settings, "Settings updated successfully");
  }
}
