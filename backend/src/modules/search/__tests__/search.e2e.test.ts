import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchService } from "../search.service";
import { SearchRepository } from "../search.repository";
import { SearchRedirectModel } from "../search.model";
import { SearchController } from "../search.controller";
import { ProductModel } from "../../product/product.model";

describe("End-to-End Accuracy Verification: Search Term Redirects Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock ProductModel queries to return cleanly without requiring a live remote cluster
    vi.spyOn(ProductModel, "find").mockReturnValue({
      select: () => ({
        limit: () => ({
          lean: () => ({
            exec: vi.fn().mockResolvedValue([]),
          }),
        }),
        lean: () => ({
          exec: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any);

    vi.spyOn(ProductModel, "distinct").mockResolvedValue(["Axor", "SMK"] as any);
  });

  const mockAxorApexRule = {
    _id: "rule_apex_001",
    searchTerm: "Axor Apex",
    cleanSearchTerm: "axor apex",
    redirectUrl: "/motorcycle-helmets/full-face-helmets/axor-apex",
    targetType: "category",
    targetTitle: "Axor Apex Full Face Helmets",
    matchType: "contains",
    synonyms: ["axor apix", "axor ap", "axor apex helmet"],
    cleanSynonyms: ["axor apix", "axor ap", "axor apex helmet"],
    isActive: true,
    redirectCount: 14,
    lastTriggeredAt: new Date("2026-11-04T12:00:00Z"),
  };

  describe("1. Exact Match & Casing Normalization Verification", () => {
    it("accurately resolves exact phrase with uppercase and messy whitespace", async () => {
      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockAxorApexRule),
        }),
      } as any);

      const spyInc = vi.spyOn(SearchRepository, "incrementRedirectCount").mockResolvedValue(undefined);

      const result = await SearchService.resolveRedirect("   AXOR APEX   ");

      expect(result.hasRedirect).toBe(true);
      expect(result.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
      expect(result.targetTitle).toBe("Axor Apex Full Face Helmets");
      expect(result.targetType).toBe("category");
      expect(spyInc).toHaveBeenCalledWith("rule_apex_001");
    });
  });

  describe("2. Typo Tolerance & Synonym Redirection Verification", () => {
    it("accurately catches customer typo 'axor apix' and routes to Axor Apex category", async () => {
      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockAxorApexRule),
        }),
      } as any);

      const result = await SearchService.resolveRedirect("axor apix");

      expect(result.hasRedirect).toBe(true);
      expect(result.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
    });

    it("accurately catches partial query 'axor ap' and routes to category", async () => {
      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      vi.spyOn(SearchRedirectModel, "find").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue([mockAxorApexRule]),
        }),
      } as any);

      const result = await SearchService.resolveRedirect("axor ap");

      expect(result.hasRedirect).toBe(true);
      expect(result.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
    });
  });

  describe("3. Autocomplete Integration (suggest endpoint)", () => {
    it("includes direct category redirect in autocomplete payload when query matches", async () => {
      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockAxorApexRule),
        }),
      } as any);

      const suggestData = await SearchService.suggest("axor apex");

      expect(suggestData.redirect).toBeDefined();
      expect(suggestData.redirect?.url).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
      expect(suggestData.redirect?.title).toBe("Axor Apex Full Face Helmets");
      expect(suggestData.redirect?.type).toBe("category");
    });

    it("leaves redirect null when query does not match any rule", async () => {
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

      const suggestData = await SearchService.suggest("unmatched term xyz");

      expect(suggestData.redirect).toBeNull();
    });
  });

  describe("4. Controller HTTP Response Verification", () => {
    it("SearchController.checkRedirect returns HTTP 200 with hasRedirect: true", async () => {
      vi.spyOn(SearchRedirectModel, "findOne").mockReturnValue({
        lean: () => ({
          exec: vi.fn().mockResolvedValue(mockAxorApexRule),
        }),
      } as any);

      const req = new Request("http://localhost:4000/api/v1/search/redirect?q=axor%20apex");
      const response = await SearchController.checkRedirect(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.hasRedirect).toBe(true);
      expect(json.data.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
    });

    it("SearchController.checkRedirect returns hasRedirect: false for empty query", async () => {
      const req = new Request("http://localhost:4000/api/v1/search/redirect?q=");
      const response = await SearchController.checkRedirect(req);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.hasRedirect).toBe(false);
    });
  });
});
