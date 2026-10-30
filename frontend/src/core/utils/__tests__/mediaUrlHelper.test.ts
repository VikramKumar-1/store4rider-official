import { describe, it, expect } from "vitest";
import {
  normalizeForCompare,
  detectImageColor,
  extractAngleNumber,
  deduplicateProductImages,
  buildVariantAltText,
} from "../mediaUrlHelper";

describe("mediaUrlHelper - Enterprise Gallery & Color Swapping", () => {
  const colors = ["Black/Red", "Black/Orange", "Black/Green"];

  describe("normalizeForCompare", () => {
    it("strips slashes, spaces, hyphens and case for comparison", () => {
      expect(normalizeForCompare("Black/Red")).toBe("blackred");
      expect(normalizeForCompare("Black - Red")).toBe("blackred");
      expect(normalizeForCompare("black/flu. green")).toBe("blackflugreen");
    });
  });

  describe("detectImageColor", () => {
    it("detects colors with dash without spaces (Magento alt text)", () => {
      const img = {
        url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/p/apex-hunter-green-1_1.jpg",
        altText: "axor hunter helmet-Black/Green",
      };
      expect(detectImageColor(img, colors)).toBe("Black/Green");
    });

    it("detects colors with dash and spaces", () => {
      const img = {
        url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-apex-hunter-black-red-helmet_1.jpg",
        altText: "axor hunter helmet- Black/Red",
      };
      expect(detectImageColor(img, colors)).toBe("Black/Red");
    });

    it("detects colors from URL tokens when alt text is generic", () => {
      const img = {
        url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/p/apex-hunter-orange-4_1.jpg",
        altText: "Axor Hunter Matt Helmets",
      };
      expect(detectImageColor(img, colors)).toBe("Black/Orange");
    });

    it("returns null for generic common images without color cues", () => {
      const img = {
        url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-size-guide.jpg",
        altText: "Axor Hunter Matt Helmets - Size Guide",
      };
      expect(detectImageColor(img, colors)).toBeNull();
    });
  });

  describe("extractAngleNumber", () => {
    it("correctly identifies angles from Magento upload suffixes", () => {
      expect(extractAngleNumber("axor-apex-hunter-black-red-helmet_1.jpg")).toBe(1);
      expect(extractAngleNumber("axor-apex-hunter-black-red-helmet-1_1.jpg")).toBe(1);
      expect(extractAngleNumber("axor-apex-hunter-black-red-helmet_1_2.jpg")).toBe(1);
      expect(extractAngleNumber("axor-apex-hunter-black-red-helmet-2_1.jpg")).toBe(2);
      expect(extractAngleNumber("apex-hunter-green-8_6.jpg")).toBe(8);
      expect(extractAngleNumber("smk-twister_modular-helmet-_3_.jpg")).toBe(3);
    });
  });

  describe("deduplicateProductImages", () => {
    it("deduplicates identical angles and Magento duplicate uploads", () => {
      const rawImages = [
        // Green angles
        { url: "https://s3.aws.com/apex-hunter-green-1_1.jpg", altText: "axor hunter helmet-Black/Green" },
        { url: "https://s3.aws.com/apex-hunter-green-2_1.jpg", altText: "axor hunter helmet-Black/Green" },
        // Duplicate green angle 1
        { url: "https://s3.aws.com/apex-hunter-green-helmet_1_1.jpg", altText: "Axor Hunter Matt Helmets - Black/Green" },

        // Red angles
        { url: "https://s3.aws.com/axor-apex-hunter-black-red-helmet_1.jpg", altText: "axor hunter helmet- Black/Red" },
        // Duplicate red angle 1
        { url: "https://s3.aws.com/axor-apex-hunter-black-red-helmet-1_1.jpg", altText: "axor hunter helmet-Black/Red" },
        // Another duplicate red angle 1
        { url: "https://s3.aws.com/axor-apex-hunter-black-red-helmet_1_2.jpg", altText: "Axor Hunter Matt Helmets - Black/Red" },
        { url: "https://s3.aws.com/axor-apex-hunter-black-red-helmet-2_1.jpg", altText: "axor hunter helmet-Black/Red" },

        // Common image
        { url: "https://s3.aws.com/axor-ece-certification.jpg", altText: "ECE 22.06 Certified" },
      ];

      const deduped = deduplicateProductImages(rawImages, colors, "Axor Hunter Matt Helmets");

      // Expect exactly 1 of Green angle 1, 1 of Green angle 2
      const greenImages = deduped.filter((i) => i.detectedColor === "Black/Green");
      expect(greenImages).toHaveLength(2);
      expect(greenImages[0].angle).toBe(1);
      expect(greenImages[1].angle).toBe(2);

      // Expect exactly 1 of Red angle 1, 1 of Red angle 2
      const redImages = deduped.filter((i) => i.detectedColor === "Black/Red");
      expect(redImages).toHaveLength(2);
      expect(redImages[0].angle).toBe(1);
      expect(redImages[1].angle).toBe(2);

      // Common image preserved
      const commonImages = deduped.filter((i) => !i.detectedColor);
      expect(commonImages).toHaveLength(1);
      expect(commonImages[0].url).toContain("axor-ece-certification.jpg");
    });
  });

  describe("buildVariantAltText - Auto SEO Alt Text with Color & Size", () => {
    it("incorporates product name, color and size properly", () => {
      const alt = buildVariantAltText("Scoyco Riding Boots", "brown", "XS");
      expect(alt).toBe("Scoyco Riding Boots - brown (XS)");
    });

    it("handles standard/single-color products by omitting 'Standard' in alt text", () => {
      const alt = buildVariantAltText("Motul Chain Lube", "Standard", "400ml");
      expect(alt).toBe("Motul Chain Lube (400ml)");
    });

    it("handles missing size gracefully", () => {
      const alt = buildVariantAltText("Axor Apex Helmet", "Matte Black", "");
      expect(alt).toBe("Axor Apex Helmet - Matte Black");
    });

    it("defaults to 'Product' if product name is empty", () => {
      const alt = buildVariantAltText("", "brown", "S");
      expect(alt).toBe("Product - brown (S)");
    });
  });
});
