import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingService } from "../setting.service";
import { SettingRepository } from "../setting.repository";

describe("SettingService - Brands Page Config & SEO", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBrandsPageSeo", () => {
    it("should return default heroTitle and the official brand description when settings are blank", async () => {
      vi.spyOn(SettingRepository, "getSettings").mockResolvedValue({
        brandsMetaTitle: "",
        brandsMetaDescription: "",
        brandsMetaKeywords: "",
        brandsHeroTitle: "",
        brandsHeroDescription: "",
      } as any);

      const result = await SettingService.getBrandsPageSeo();

      expect(result.heroTitle).toBe("Shop By Brand");
      expect(result.heroDescription).toContain("Store4Riders is an online multi-brand riding gear store launched in 2016");
      expect(result.heroDescription).toContain("Check out the brands we have on offer.");
    });

    it("should return custom configured heroTitle and heroDescription when present in database", async () => {
      vi.spyOn(SettingRepository, "getSettings").mockResolvedValue({
        brandsMetaTitle: "Custom Title",
        brandsMetaDescription: "Custom Meta Desc",
        brandsMetaKeywords: "custom, keywords",
        brandsHeroTitle: "Official Indian & International Brands",
        brandsHeroDescription: "Custom rider description from admin panel.",
      } as any);

      const result = await SettingService.getBrandsPageSeo();

      expect(result.heroTitle).toBe("Official Indian & International Brands");
      expect(result.heroDescription).toBe("Custom rider description from admin panel.");
      expect(result.metaTitle).toBe("Custom Title");
    });
  });

  describe("updateBrandsPageSeo", () => {
    it("should update heroTitle, heroDescription and SEO fields", async () => {
      const updateSettingsSpy = vi
        .spyOn(SettingRepository, "updateSettings")
        .mockImplementation(async (data: any) => data as any);

      await SettingService.updateBrandsPageSeo({
        heroTitle: "Updated Brands Title",
        heroDescription: "Updated riding store story",
        metaTitle: "Updated SEO Title",
        metaDescription: "Updated SEO Desc",
        metaKeywords: "helmets, gear",
      });

      expect(updateSettingsSpy).toHaveBeenCalledWith({
        brandsHeroTitle: "Updated Brands Title",
        brandsHeroDescription: "Updated riding store story",
        brandsMetaTitle: "Updated SEO Title",
        brandsMetaDescription: "Updated SEO Desc",
        brandsMetaKeywords: "helmets, gear",
      });
    });
  });
});
