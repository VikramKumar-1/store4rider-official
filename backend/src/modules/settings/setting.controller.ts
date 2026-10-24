import { SettingService } from "./setting.service";
import { SettingValidator } from "./setting.validator";
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
      codPartialPaymentEnabled: Boolean(settings.codPartialPaymentEnabled),
      codPartialPaymentType: settings.codPartialPaymentType,
      codPartialPaymentValue: settings.codPartialPaymentValue,
      packagePresets: settings.packagePresets,
      gstin: settings.gstin,
      legalBusinessName: settings.legalBusinessName,
      gstPricingMode: settings.gstPricingMode || "inclusive",
      allowB2bGstin: settings.allowB2bGstin !== false,
      storeOriginState: settings.storeOriginState,
      storeOriginCity: settings.storeOriginCity,
      storeOriginPincode: settings.storeOriginPincode,
      storeOriginAddress: settings.storeOriginAddress,
      storeOriginPhone: settings.storeOriginPhone,
      supportPhone: settings.supportPhone || settings.storeOriginPhone,
      supportEmail: settings.supportEmail || "contact@store4riders.com",
      whatsappNumber: settings.whatsappNumber,
      facebookUrl: settings.facebookUrl,
      instagramUrl: settings.instagramUrl,
      youtubeUrl: settings.youtubeUrl,
      returnWindowDays: settings.returnWindowDays || 7,
      snapmintMinOrderValue: settings.snapmintMinOrderValue ?? (Number(process.env.SNAPMINT_MIN_ORDER_VALUE) || 25000),
    };
    return ApiResponse.success(publicData, "Public settings retrieved successfully");
  }

  static async updateSettings(req: any) {
    const validatedData = await SettingValidator.validateUpdateSettings(req);
    const settings = await SettingService.updateSettings(validatedData);
    return ApiResponse.success(settings, "Settings updated successfully");
  }
}
