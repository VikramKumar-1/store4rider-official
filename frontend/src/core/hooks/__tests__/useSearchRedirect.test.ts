import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkSearchRedirect } from "../useSearch";
import { apiClient } from "../../api/client";

describe("Frontend Search Redirect Client Verification", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("checkSearchRedirect returns hasRedirect: true and target URL when API matches", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        success: true,
        data: {
          hasRedirect: true,
          redirectUrl: "/motorcycle-helmets/full-face-helmets/axor-apex",
          targetTitle: "Axor Apex Full Face Helmets",
          targetType: "category",
          searchTerm: "axor apex",
        },
      },
    } as any);

    const result = await checkSearchRedirect("axor apex");

    expect(result.hasRedirect).toBe(true);
    expect(result.redirectUrl).toBe("/motorcycle-helmets/full-face-helmets/axor-apex");
    expect(result.targetTitle).toBe("Axor Apex Full Face Helmets");
    expect(apiClient.get).toHaveBeenCalledWith("/search/redirect?q=axor%20apex");
  });

  it("checkSearchRedirect gracefully returns hasRedirect: false for unmapped terms or network error", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network offline"));

    const result = await checkSearchRedirect("unmapped product");

    expect(result.hasRedirect).toBe(false);
  });

  it("checkSearchRedirect returns hasRedirect: false for whitespace-only query without calling API", async () => {
    const spy = vi.spyOn(apiClient, "get");

    const result = await checkSearchRedirect("    ");

    expect(result.hasRedirect).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});
