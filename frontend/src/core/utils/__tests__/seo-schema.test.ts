import { describe, it, expect } from "vitest";
import {
  cleanText,
  buildWebSiteSchema,
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildProductSchema,
  buildCollectionSchema,
  buildFAQSchema,
} from "../seo-schema";

describe("SEO Schema Utilities", () => {
  describe("cleanText", () => {
    it("should strip HTML tags and decode HTML entities", () => {
      const raw = "<p>Super <strong>fast</strong> &amp; safe helmet with &quot;ECE&quot; cert.</p>";
      expect(cleanText(raw)).toBe('Super fast & safe helmet with "ECE" cert.');
    });

    it("should return empty string for null, undefined, or empty input", () => {
      expect(cleanText(undefined)).toBe("");
      expect(cleanText("")).toBe("");
      expect(cleanText("   ")).toBe("");
    });

    it("should remove inline script and style tags completely", () => {
      const dangerous = "<script>alert('xss')</script><style>.hidden{display:none}</style>Clean Jacket";
      expect(cleanText(dangerous)).toBe("Clean Jacket");
    });
  });

  describe("buildWebSiteSchema", () => {
    it("should generate a valid Schema.org WebSite with SearchAction", () => {
      const schema = buildWebSiteSchema("https://store4riders.com/");
      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("WebSite");
      expect(schema["@id"]).toBe("https://store4riders.com/#website");
      expect(schema.name).toBe("Store4Riders");
      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction["@type"]).toBe("SearchAction");
      expect(schema.potentialAction.target.urlTemplate).toBe("https://store4riders.com/search?q={search_term_string}");
    });
  });

  describe("buildOrganizationSchema", () => {
    it("should generate valid Organization schema with Exchange/StoreCredit policy", () => {
      const schema = buildOrganizationSchema({
        siteUrl: "https://store4riders.com",
        legalName: "Store4Riders India",
        returnWindowDays: 7,
      });

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toEqual(["Organization", "OnlineStore"]);
      expect(schema.name).toBe("Store4Riders India");
      expect(schema["@id"]).toBe("https://store4riders.com/#organization");

      // Merchant Return Policy check
      const policy = schema.hasMerchantReturnPolicy;
      expect(policy).toBeDefined();
      expect(policy.merchantReturnDays).toBe(7);
      expect(policy.refundType).toContain("https://schema.org/ExchangeRefund");
      expect(policy.refundType).toContain("https://schema.org/StoreCreditRefund");
    });
  });

  describe("buildBreadcrumbSchema", () => {
    it("should generate valid BreadcrumbList with positions starting from 1", () => {
      const items = [
        { name: "Home", url: "/" },
        { name: "Riding Gear", url: "/riding-gear" },
        { name: "Jackets", url: "/riding-gear/jackets" },
      ];

      const schema = buildBreadcrumbSchema(items, "https://store4riders.com");
      expect(schema["@type"]).toBe("BreadcrumbList");
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].item).toBe("https://store4riders.com/");
      expect(schema.itemListElement[2].position).toBe(3);
      expect(schema.itemListElement[2].name).toBe("Jackets");
    });
  });

  describe("buildProductSchema", () => {
    it("should generate valid Product schema with InStock offer and 7-day exchange policy", () => {
      const product = {
        name: "Alpinestars T-GP Plus R v3 Air Jacket",
        slug: "alpinestars-t-gp-plus-r-v3-air-jacket",
        sku: "ALP-TGP-001",
        basePrice: 18999,
        specialPrice: 16999,
        stockStatus: 1,
        brand: "Alpinestars",
        description: "<p>Premium CE certified riding jacket.</p>",
        images: [{ url: "https://cdn.store4riders.com/jacket.jpg", altText: "Jacket" }],
      };

      const schema = buildProductSchema(
        product as any,
        "https://store4riders.com",
        "Riding Gear > Jackets"
      );

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Product");
      expect(schema.name).toBe(product.name);
      expect(schema.sku).toBe("ALP-TGP-001");
      expect(schema.brand.name).toBe("Alpinestars");
      expect(schema.category).toBe("Riding Gear > Jackets");

      // Offer verification
      const offer = schema.offers;
      expect(offer["@type"]).toBe("Offer");
      expect(offer.price).toBe(16999);
      expect(offer.priceCurrency).toBe("INR");
      expect(offer.availability).toBe("https://schema.org/InStock");
      expect(offer.hasMerchantReturnPolicy.refundType).toContain("https://schema.org/ExchangeRefund");
      expect(offer.hasMerchantReturnPolicy.refundType).toContain("https://schema.org/StoreCreditRefund");
    });

    it("should handle OutOfStock product and fallback to basePrice if no specialPrice", () => {
      const product = {
        name: "LS2 Stream II Helmet",
        slug: "ls2-stream-ii-helmet",
        sku: "LS2-STRM-02",
        basePrice: 5499,
        stockStatus: 0,
        images: [],
      };

      const schema = buildProductSchema(product as any, "https://store4riders.com");
      expect(schema.offers.price).toBe(5499);
      expect(schema.offers.availability).toBe("https://schema.org/OutOfStock");
      expect(schema.image).toEqual(["https://store4riders.com/Store4riders-Logo.jpg"]);
    });
  });

  describe("buildFAQSchema", () => {
    it("should construct valid FAQPage schema from questions and answers", () => {
      const faqs = [
        { question: "What is your return policy?", answer: "We offer a 7-day size exchange or store credit." },
        { question: "Do you offer COD?", answer: "Yes, COD is available across most serviceable pincodes." },
      ];

      const schema = buildFAQSchema(faqs);
      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]["@type"]).toBe("Question");
      expect(schema.mainEntity[0].name).toBe("What is your return policy?");
      expect(schema.mainEntity[0].acceptedAnswer.text).toBe("We offer a 7-day size exchange or store credit.");
    });
  });
});
