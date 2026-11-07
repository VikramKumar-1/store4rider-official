import { describe, it, expect } from "vitest";
import {
  normalizeForCompare,
  detectImageColor,
  extractAngleNumber,
  deduplicateProductImages,
  buildVariantAltText,
  getCartItemImage,
  getProductThumbnailUrl,
  getProductCandidateImages,
  resolveMagentoMediaUrls,
  S3_MEDIA_BASE,
  isUtilityOrInfographicImage,
  getPreferredInStockColor,
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

  describe("getProductThumbnailUrl & getProductCandidateImages", () => {
    it("resolves preferredColor from colorImages map", () => {
      const product = {
        name: "Axor Saber Spark Helmet",
        colorImages: {
          "Black/Red": "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-saber-spark-helmet-black-red-_9__1.jpg",
          "Black/Grey": "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/s/a/saber-spark-helmet-black-grey-_9__1.jpg"
        },
        images: [
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-saber-spark-helmet-black-red-_9_.jpg" }
        ]
      };
      const url = getProductThumbnailUrl(product, "Black/Grey");
      expect(url).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/s/a/saber-spark-helmet-black-grey-_9__1.jpg");
    });

    it("resolves primary thumbnail from product.thumbnail", () => {
      const product = {
        name: "Axor Saber Spark Helmet",
        thumbnail: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-saber-spark-helmet-black-red-_9_.jpg",
        images: []
      };
      const url = getProductThumbnailUrl(product);
      expect(url).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-saber-spark-helmet-black-red-_9_.jpg");
    });

    it("resolves primary thumbnail from product.images[0] when thumbnail is missing", () => {
      const product = {
        name: "Axor Saber Spark Helmet",
        images: [
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-saber-spark-helmet-black-red-_9_.jpg" }
        ]
      };
      const url = getProductThumbnailUrl(product);
      expect(url).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-saber-spark-helmet-black-red-_9_.jpg");
    });

    it("resolves from colorImages if images array is empty", () => {
      const product = {
        name: "Helmet",
        colorImages: {
          "Red": "https://store4riders.s3.ap-south-2.amazonaws.com/red.jpg"
        }
      };
      const url = getProductThumbnailUrl(product);
      expect(url).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/red.jpg");
    });

    it("resolves from variants if images and colorImages are empty", () => {
      const product = {
        name: "Helmet",
        variants: [
          { sku: "H-1", imageUrl: "https://store4riders.s3.ap-south-2.amazonaws.com/variant.jpg" }
        ]
      };
      const url = getProductThumbnailUrl(product);
      expect(url).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/variant.jpg");
    });

    it("returns /no-image.svg when product has no images anywhere", () => {
      const product = { name: "No image product" };
      const url = getProductThumbnailUrl(product);
      expect(url).toBe("/no-image.svg");
    });

    it("collects distinct candidate images for fallback retry", () => {
      const product = {
        name: "Axor Saber Spark Helmet",
        thumbnail: "https://store4riders.s3.ap-south-2.amazonaws.com/thumb.jpg",
        images: [
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/img1.jpg" },
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/img2.jpg" }
        ],
        variants: [
          { imageUrl: "https://store4riders.s3.ap-south-2.amazonaws.com/v1.jpg" }
        ]
      };
      const candidates = getProductCandidateImages(product);
      expect(candidates).toEqual([
        "https://store4riders.s3.ap-south-2.amazonaws.com/thumb.jpg",
        "https://store4riders.s3.ap-south-2.amazonaws.com/img1.jpg",
        "https://store4riders.s3.ap-south-2.amazonaws.com/img2.jpg",
        "https://store4riders.s3.ap-south-2.amazonaws.com/v1.jpg"
      ]);
    });

    it("skips safety certs and size charts when picking card thumbnail", () => {
      const productWithCertFirst = {
        name: "Axor Apex Helmet",
        images: [
          {
            url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-ece-dot-safety-certification.jpg",
            altText: "ECE 22.06 & DOT Certified Helmet - Matte Black EPS",
          },
          {
            url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-apex-helmet-photo-1.jpg",
            altText: "Axor Apex Helmet - Matte Black",
          },
        ],
      };
      // Must NOT select the safety certification graphic
      const url = getProductThumbnailUrl(productWithCertFirst);
      expect(url).toBe("https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/a/x/axor-apex-helmet-photo-1.jpg");
    });
  });

  describe("isUtilityOrInfographicImage - Anti-Leak Protection", () => {
    it("correctly identifies safety badges, certifications, size charts and infographics", () => {
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/helmet-ece-22-06.jpg", altText: "Safety Cert" })).toBe(true);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/rynox-size-chart.jpg", altText: "Size Guide" })).toBe(true);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/warranty-badge.png", altText: "1 Year Warranty" })).toBe(true);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/features-diagram.jpg", altText: "Helmet Anatomy Features" })).toBe(true);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/dot-certified-isi.jpg", altText: "ISI Mark" })).toBe(true);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/wash-care-guide.jpg", altText: "Care instructions" })).toBe(true);
    });

    it("does not false-positive on real product images", () => {
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/axor-apex-hunter-black-red_1.jpg", altText: "Axor Apex Hunter - Black/Red" })).toBe(false);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/rynox-stealth-evo-3-jacket-black.jpg", altText: "Rynox Stealth Evo 3 Jacket" })).toBe(false);
      expect(isUtilityOrInfographicImage({ url: "/catalog/product/bobo-bm4-jaw-grip.jpg", altText: "BOBO BM4 Pro Jaw-Grip Motorcycle Mobile Mount" })).toBe(false);
    });

    it("prevents safety images from being detected as color variants even if text mentions color", () => {
      const certImg = {
        url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/ece-safety-certification.jpg",
        altText: "ECE 22.06 Certified Helmet - Black/Red Inner Cushion",
      };
      // Even though alt text has 'Black/Red', detectImageColor must return null because it's a certification image!
      expect(detectImageColor(certImg, colors)).toBeNull();
    });
  });

  describe("getPreferredInStockColor - Exact Card and PDP Image Synchronization", () => {
    it("returns primary color matching thumbnail when all variants are out of stock (so card and PDP match)", () => {
      const product = {
        name: "Forma Ice Pro Boots",
        thumbnail: "https://store4riders.s3.ap-south-2.amazonaws.com/ice-pro-fl.yellow-1.jpg",
        images: [
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/ice-pro-fl.yellow-1.jpg", altText: "Forma Ice Pro - Flu. Yellow" },
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/ice-pro-black-1.jpg", altText: "Forma Ice Pro - Black" }
        ],
        variants: [
          { sku: "YL-40", stock: 0, attributes: { color: "Flu. Yellow" } },
          { sku: "BK-40", stock: 0, attributes: { color: "Black" } }
        ]
      };
      // Primary image represents Flu. Yellow. Even with 0 stock, must return Flu. Yellow so card and PDP show same boot
      expect(getPreferredInStockColor(product)).toBe("Flu. Yellow");
    });

    it("returns in-stock color when primary color is out of stock", () => {
      const product = {
        name: "BB Xplorer Jacket",
        thumbnail: "https://store4riders.s3.ap-south-2.amazonaws.com/jacket-orange.jpg",
        images: [
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/jacket-orange.jpg", altText: "BB Xplorer - Orange" },
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/jacket-red.jpg", altText: "BB Xplorer - Red" }
        ],
        variants: [
          { sku: "OR-M", stock: 0, attributes: { color: "Orange" } },
          { sku: "RD-M", stock: 5, attributes: { color: "Red" } }
        ]
      };
      expect(getPreferredInStockColor(product)).toBe("Red");
    });

    it("returns primary color when backorders are allowed", () => {
      const product = {
        name: "Riding Jacket",
        allowBackorders: true,
        thumbnail: "https://store4riders.s3.ap-south-2.amazonaws.com/jacket-black.jpg",
        images: [
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/jacket-black.jpg", altText: "Jacket - Black" },
          { url: "https://store4riders.s3.ap-south-2.amazonaws.com/jacket-grey.jpg", altText: "Jacket - Grey" }
        ],
        variants: [
          { sku: "BK", stock: 0, attributes: { color: "Black" } },
          { sku: "GR", stock: 0, attributes: { color: "Grey" } }
        ]
      };
      expect(getPreferredInStockColor(product)).toBe("Black");
    });
  });
});
