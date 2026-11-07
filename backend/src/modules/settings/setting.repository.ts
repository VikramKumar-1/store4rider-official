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
        enabledGateways: ["payu", "ccavenue", "snapmint", "cod"]
      });
    } else if (!settings.enabledGateways) {
      settings.enabledGateways = ["payu", "ccavenue", "snapmint", "cod"];
      await settings.save();
    } else if (settings.enabledGateways.some((g: string) => g === "upi" || g === "gpay")) {
      settings.enabledGateways = settings.enabledGateways.filter((g: string) => g !== "upi" && g !== "gpay");
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
    
    // Ensure footerConfig has dedicated columns for Policies & Legal and About Us
    if (settings.footerConfig) {
      const fc = settings.footerConfig as any;
      let footerChanged = false;
      const policyUrls = ["/terms", "/privacy", "/legal", "/store-policies"];
      const aboutUrls = ["/about-us", "/contact-us"];

      if (!fc.column3Title) {
        fc.column3Title = "POLICIES & LEGAL";
        footerChanged = true;
      }
      if (!fc.column4Title) {
        fc.column4Title = "ABOUT US";
        footerChanged = true;
      }

      if (Array.isArray(fc.column1Links) && fc.column1Links.some((l: any) => policyUrls.includes(l.url))) {
        const extractedPolicies = fc.column1Links.filter((l: any) => policyUrls.includes(l.url));
        fc.column1Links = fc.column1Links.filter((l: any) => !policyUrls.includes(l.url));
        if (!fc.column3Links || fc.column3Links.length === 0) {
          fc.column3Links = extractedPolicies;
        }
        footerChanged = true;
      } else if (!fc.column3Links || fc.column3Links.length === 0) {
        fc.column3Links = [
          { label: "Conditions of Sale & Use", url: "/terms", openInNewTab: false },
          { label: "Privacy and Cookie Policy", url: "/privacy", openInNewTab: false },
          { label: "Legal", url: "/legal", openInNewTab: false },
          { label: "Store Policies", url: "/store-policies", openInNewTab: false },
        ];
        footerChanged = true;
      }

      if (Array.isArray(fc.column2Links) && fc.column2Links.some((l: any) => aboutUrls.includes(l.url))) {
        const extractedAbout = fc.column2Links.filter((l: any) => aboutUrls.includes(l.url));
        fc.column2Links = fc.column2Links.filter((l: any) => !aboutUrls.includes(l.url));
        if (!fc.column4Links || fc.column4Links.length === 0) {
          fc.column4Links = extractedAbout;
        }
        footerChanged = true;
      } else if (!fc.column4Links || fc.column4Links.length === 0) {
        fc.column4Links = [
          { label: "About us", url: "/about-us", openInNewTab: false },
          { label: "Contact Us", url: "/contact-us", openInNewTab: false },
        ];
        footerChanged = true;
      }

      if (footerChanged) {
        settings.markModified("footerConfig");
        await settings.save();
      }
    }

    return settings;
  }

  static async updateSettings(data: Partial<ISetting>): Promise<ISetting> {
    const settings = await this.getSettings();
    const { _id, __v, createdAt, updatedAt, id, ...cleanData } = data as any;
    Object.assign(settings, cleanData);
    return await settings.save();
  }
}
