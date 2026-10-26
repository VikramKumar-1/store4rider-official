import { describe, it, expect } from "vitest";
import { resolveFuzzySearchTerms, getGearAccessoryExclusion, correctTypo } from "../../../core/utils/fuzzySearch";
import { ProductValidator } from "../../product/product.validator";
import { NextRequest } from "next/server";

describe("Search Relevance & Typo-Tolerance Suite", () => {
  const createMockReq = (url: string) => {
    return {
      nextUrl: new URL(url),
    } as NextRequest;
  };

  describe("1. Fuzzy Typo Resolution", () => {
    it("should correct 'helemt' to 'helmet'", () => {
      const result = resolveFuzzySearchTerms("helemt");
      expect(result.isCorrected).toBe(true);
      expect(result.correctedQuery).toBe("helmet");
      expect(result.correctedTerms).toContain("helmet");
    });

    it("should correct 'helmt' to 'helmet'", () => {
      const result = resolveFuzzySearchTerms("helmt");
      expect(result.isCorrected).toBe(true);
      expect(result.correctedQuery).toBe("helmet");
    });

    it("should correct 'jaket' to 'jacket'", () => {
      const result = resolveFuzzySearchTerms("jaket");
      expect(result.isCorrected).toBe(true);
      expect(result.correctedQuery).toBe("jacket");
    });

    it("should recognize exact vocabulary words without correction", () => {
      expect(correctTypo("helmet")).toBe("helmet");
      expect(correctTypo("bandana")).toBe("bandana");
      expect(correctTypo("balaclava")).toBe("balaclava");
      expect(correctTypo("axor")).toBe("axor");
      expect(correctTypo("rynox")).toBe("rynox");
    });
  });

  describe("2. Gear Accessory Exclusion Logic (Anti-Bandana Hijack)", () => {
    it("should return accessory exclusion regex when searching core gear 'helmet'", () => {
      const exclusion = getGearAccessoryExclusion(["helmet"]);
      expect(exclusion).not.toBeNull();
      // Must match bandanas, balaclavas, visors, cleaners
      expect(exclusion!.test("Rynox Dry Ice Cooling Bandana")).toBe(true);
      expect(exclusion!.test("Buff Balaclava Mask")).toBe(true);
      expect(exclusion!.test("Axor Clear Visor")).toBe(true);
      expect(exclusion!.test("Motul Helmet Cleaner Spray")).toBe(true);

      // Must NOT match actual helmets
      expect(exclusion!.test("Axor Apex Venomous Helmet")).toBe(false);
      expect(exclusion!.test("SMK Typhoon Full Face Helmet")).toBe(false);
      expect(exclusion!.test("MT Thunder 3 SV Helmet")).toBe(false);
    });

    it("should NOT exclude accessories when user explicitly searches for that accessory (e.g. 'helmet visor')", () => {
      const exclusion = getGearAccessoryExclusion(["helmet", "visor"]);
      expect(exclusion).toBeNull();
    });

    it("should NOT exclude accessories when user explicitly searches for 'bandana'", () => {
      const exclusion = getGearAccessoryExclusion(["bandana"]);
      expect(exclusion).toBeNull();
    });

    it("should NOT exclude accessories when user explicitly searches for 'balaclava'", () => {
      const exclusion = getGearAccessoryExclusion(["balaclava"]);
      expect(exclusion).toBeNull();
    });
  });

  describe("3. ProductValidator Query Construction with Search", () => {
    it("should add accessory exclusion when searching 'search=helemt'", () => {
      const req = createMockReq("http://localhost/api/products?search=helemt");
      const { filters } = ProductValidator.validateListQuery(req);

      expect(filters.$and).toBeDefined();
      const andConditions = filters.$and as any[];

      // Verify that a name exclusion regex exists in $and
      const hasAccessoryExclusion = andConditions.some(
        (c: any) => c.name && c.name.$not instanceof RegExp && c.name.$not.test("Rynox Bandana")
      );
      expect(hasAccessoryExclusion).toBe(true);
    });

    it("should NOT add accessory exclusion when searching 'search=helmet visor'", () => {
      const req = createMockReq("http://localhost/api/products?search=helmet%20visor");
      const { filters } = ProductValidator.validateListQuery(req);

      const andConditions = (filters.$and as any[]) || [];
      const hasAccessoryExclusion = andConditions.some(
        (c: any) => c.name && c.name.$not instanceof RegExp && c.name.$not.test("Axor Visor")
      );
      expect(hasAccessoryExclusion).toBe(false);
    });
  });
});
