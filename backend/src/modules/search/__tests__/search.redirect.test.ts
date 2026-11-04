import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchRepository } from "../search.repository";
import { SearchRedirectModel } from "../search.model";
import { SearchValidator } from "../search.validator";

describe("Search Terms & Category Redirect Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Search Redirect Validation", () => {
    it("should accept valid search redirect payload", () => {
      const valid = {
        searchTerm: "axor apex",
        redirectUrl: "/motorcycle-helmets/full-face-helmets/axor-apex",
        targetType: "category",
        targetTitle: "Axor Apex Full Face Helmets",
        matchType: "exact",
        synonyms: ["axor apix", "axor ap"],
        isActive: true,
      };

      const result = SearchValidator.createRedirect.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.searchTerm).toBe("axor apex");
        expect(result.data.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
        expect(result.data.synonyms).toHaveLength(2);
      }
    });

    it("should reject empty searchTerm or empty redirectUrl", () => {
      const invalid = {
        searchTerm: "",
        redirectUrl: "",
      };

      const result = SearchValidator.createRedirect.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should accept valid list query pagination parameters", () => {
      const query = { page: "2", limit: "50", search: "apex" };
      const result = SearchValidator.listRedirectsQuery.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(2);
        expect(result.data.limit).toBe(50);
        expect(result.data.search).toBe("apex");
      }
    });
  });

  describe("2. Redirect Resolution Logic", () => {
    it("should match exact search term regardless of casing or extra whitespace", async () => {
      const mockRule = {
        _id: "rule_123",
        searchTerm: "Axor Apex",
        cleanSearchTerm: "axor apex",
        redirectUrl: "/motorcycle-helmets/full-face-helmets/axor-apex",
        targetTitle: "Axor Apex Helmets",
        targetType: "category",
        matchType: "exact",
        cleanSynonyms: ["axor apix"],
        isActive: true,
      };

      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockRule),
        }),
      } as any);

      const result = await SearchRepository.findMatchingRedirect("   AXOR APEX   ");
      expect(result).not.toBeNull();
      expect(result?.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
      expect(result?.targetTitle).toBe("Axor Apex Helmets");
    });

    it("should match mapped synonym for typo handling", async () => {
      const mockRule = {
        _id: "rule_456",
        searchTerm: "Axor Apex",
        cleanSearchTerm: "axor apex",
        redirectUrl: "/motorcycle-helmets/full-face-helmets/axor-apex",
        targetTitle: "Axor Apex Helmets",
        targetType: "category",
        matchType: "exact",
        cleanSynonyms: ["axor apix"],
        isActive: true,
      };

      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockRule),
        }),
      } as any);

      const result = await SearchRepository.findMatchingRedirect("axor apix");
      expect(result).not.toBeNull();
      expect(result?.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
    });

    it("should resolve partial contains queries when matchType is contains", async () => {
      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      const mockContainsRule = {
        _id: "rule_789",
        searchTerm: "Riding Gloves",
        cleanSearchTerm: "riding gloves",
        redirectUrl: "/riding-gear/riding-gloves",
        targetTitle: "Motorcycle Riding Gloves",
        targetType: "category",
        matchType: "contains",
        cleanSynonyms: ["gloves", "glo"],
        isActive: true,
      };

      vi.spyOn(SearchRedirectModel, "find").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue([mockContainsRule]),
        }),
      } as any);

      const result = await SearchRepository.findMatchingRedirect("glo");
      expect(result).not.toBeNull();
      expect(result?.redirectUrl).toBe("/riding-gear/riding-gloves");
    });

    it("should return null if query is empty or no rule matches", async () => {
      const resultEmpty = await SearchRepository.findMatchingRedirect("   ");
      expect(resultEmpty).toBeNull();

      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(null),
        }),
      } as any);
      vi.spyOn(SearchRedirectModel, "find").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue([]),
        }),
      } as any);

      const resultUnknown = await SearchRepository.findMatchingRedirect("unmatched query xyz");
      expect(resultUnknown).toBeNull();
    });
  });
});
