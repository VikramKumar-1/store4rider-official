import { describe, it, expect } from "vitest";
import {
  normalizeForCompare,
  detectImageColor,
  extractAngleNumber,
  deduplicateProductImages,
  buildVariantAltText,
  getCartItemImage,
  resolveMagentoMediaUrls,
  S3_MEDIA_BASE,
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

  describe("getCartItemImage - Color & Variant Image Resolution", () => {
    it("returns explicit item image if present", () => {
      const item = {
        image: "https://store4riders.com/golden-helmet.jpg",
        product: {
          images: [{ url: "https://store4riders.com/yellow-helmet.jpg" }],
        },
      };
      expect(getCartItemImage(item)).toBe("https://store4riders.com/golden-helmet.jpg");
    });

    it("matches image by selectedColor from product.images if item.image is absent", () => {
      const item = {
        product: {
          selectedColor: "Golden",
          images: [
            { url: "https://store4riders.com/yellow-helmet.jpg", altText: "Test Helmet - Yellow" },
            { url: "https://store4riders.com/golden-helmet.jpg", altText: "Test Helmet - Golden" },
          ],
        },
      };
      expect(getCartItemImage(item)).toBe("https://store4riders.com/golden-helmet.jpg");
    });

    it("falls back to first image when no color matches", () => {
      const item = {
        product: {
          images: [
            { url: "https://store4riders.com/default-helmet.jpg", altText: "Test Helmet" },
          ],
        },
      };
      expect(getCartItemImage(item)).toBe("https://store4riders.com/default-helmet.jpg");
    });
  });

  describe("resolveMagentoMediaUrls - Rich Description & CMS Media URL Resolution", () => {
    it("resolves Magento {{media url=...}} directives with spaces to encoded S3 URLs", () => {
      const input = '<img src="{{media url="wysiwyg/Rynox product description photos/Rynox Urban X riding jacket Powertector Air-Tec Chest Protection.jpg"}}">';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toContain("https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/Rynox%20product%20description%20photos/Rynox%20Urban%20X%20riding%20jacket%20Powertector%20Air-Tec%20Chest%20Protection.jpg");
    });

    it("fixes corrupted catalog/product/wysiwyg paths to valid wysiwyg paths on S3", () => {
      const input = '<img src="https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/wysiwyg/smk-twister-specification.JPG">';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toBe('<img src="https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/smk-twister-specification.JPG">');
    });

    it("cleans &quot; and catalog/product corruption from imported paths", () => {
      const input = '<img src="https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/&quot;wysiwyg/PARANI-M10-_9_.jpg&quot;">';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toBe('<img src="https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/PARANI-M10-_9_.jpg">');
    });

    it("redirects catalog/product/ description images without subfolder to wysiwyg", () => {
      const input = '<img src="https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/axor-apex-turbine-security.jpg">';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toBe('<img src="https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/axor-apex-turbine-security.jpg">');
    });

    it("rewrites legacy mmpl.store4riders.com domain to active S3 bucket", () => {
      const input = '<img src=https://www.mmpl.store4riders.com/pub/media/SMK-Stellar-design-helmet-1.jpg />';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toBe('<img src="https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/SMK-Stellar-design-helmet-1.jpg" />');
    });

    it("cleans CSV doubled quotes and resolves media tags", () => {
      const input = '<img src=""{{media url=""wysiwyg/smk-typhoon.jpg""}}"" width=""350"">';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toBe('<img src="https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/smk-typhoon.jpg" width="350">');
    });

    it("decodes escaped HTML entities containing tags and resolves media inside", () => {
      const input = '&lt;p&gt;&lt;img src="{{media url=&quot;wysiwyg/test-chart.jpg&quot;}}" /&gt;&lt;/p&gt;';
      const output = resolveMagentoMediaUrls(input);
      expect(output).toBe('<p><img src="https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/test-chart.jpg" /></p>');
    });
  });
});
