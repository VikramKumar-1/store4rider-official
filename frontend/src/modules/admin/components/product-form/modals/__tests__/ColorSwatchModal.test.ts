import { describe, it, expect } from "vitest";
import { getGradientCss, getReadableColorName, extractColorsFromCss } from "../ColorSwatchModal";
import { parseColorToBackground } from "@/modules/product-detail/components/ProductDetailPageModule";

describe("ColorSwatchModal & Multi-Color Swatch Engine", () => {
  describe("getGradientCss generation", () => {
    it("generates solid color for 1 color", () => {
      const result = getGradientCss(1, ["#D4AF37", "#FFFFFF"]);
      expect(result).toBe("#D4AF37");
    });

    it("generates 2-band diagonal split gradient for 2 colors", () => {
      const result = getGradientCss(2, ["#EAB308", "#DC2626"]);
      expect(result).toContain("linear-gradient(135deg");
      expect(result).toContain("#EAB308 0%");
      expect(result).toContain("#EAB308 49.5%");
      expect(result).toContain("#DC2626 50.5%");
      expect(result).toContain("#DC2626 100%");
    });

    it("generates 3-band diagonal gradient for 3 colors (Tri-Color / Racing)", () => {
      const result = getGradientCss(3, ["#009246", "#FFFFFF", "#CE2B37"]);
      expect(result).toContain("linear-gradient(135deg");
      expect(result).toContain("#009246 0%");
      expect(result).toContain("#FFFFFF 33.3%");
      expect(result).toContain("#CE2B37 100%");
    });

    it("generates 4-band diagonal gradient for 4 colors (Quad graphic)", () => {
      const result = getGradientCss(4, ["#111111", "#FFFFFF", "#DC2626", "#6B7280"]);
      expect(result).toContain("linear-gradient(135deg");
      expect(result).toContain("#111111 0%");
      expect(result).toContain("#FFFFFF 25.5%");
      expect(result).toContain("#DC2626 50.5%");
      expect(result).toContain("#6B7280 100%");
    });
  });

  describe("parseColorToBackground auto-detection", () => {
    it("correctly identifies single colors", () => {
      expect(parseColorToBackground("Golden")).toBe("#D4AF37");
      expect(parseColorToBackground("Black")).toBe("#111111");
      expect(parseColorToBackground("Gloss Red")).toBe("#DC2626");
    });

    it("correctly auto-draws 2-tone diagonal split", () => {
      const res = parseColorToBackground("Flu. green/Red");
      expect(res).toContain("linear-gradient(135deg");
      expect(res).toContain("#CCFF00");
      expect(res).toContain("#DC2626");
    });

    it("correctly auto-draws 3-tone gradient (e.g. Black / Yellow / Red)", () => {
      const res = parseColorToBackground("Black / Yellow / Red");
      expect(res).toContain("linear-gradient(135deg");
      expect(res).toContain("#111111");
      expect(res).toContain("#EAB308");
      expect(res).toContain("#DC2626");
    });

    it("correctly auto-draws 4-tone gradient (e.g. Black / White / Red / Grey)", () => {
      const res = parseColorToBackground("Black / White / Red / Grey");
      expect(res).toContain("linear-gradient(135deg");
      expect(res).toContain("#111111");
      expect(res).toContain("#FFFFFF");
      expect(res).toContain("#DC2626");
      expect(res).toContain("#6B7280");
    });
  });

  describe("Hex code extraction from gradient strings", () => {
    it("extracts 3 colors from a 3-band gradient string", () => {
      const gradient = getGradientCss(3, ["#009246", "#FFFFFF", "#CE2B37"]);
      const matches = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
      const unique = Array.from(new Set(matches?.map((m) => m.toUpperCase())));
      expect(unique).toEqual(["#009246", "#FFFFFF", "#CE2B37"]);
    });

    it("extracts 4 colors from a 4-band gradient string", () => {
      const gradient = getGradientCss(4, ["#111111", "#FFFFFF", "#DC2626", "#6B7280"]);
      const matches = gradient.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g);
      const unique = Array.from(new Set(matches?.map((m) => m.toUpperCase())));
      expect(unique).toEqual(["#111111", "#FFFFFF", "#DC2626", "#6B7280"]);
    });
  });

  describe("getReadableColorName", () => {
    it("converts hex codes to friendly English color names", () => {
      expect(getReadableColorName("#DC2626")).toBe("Gloss Red");
      expect(getReadableColorName("#EAB308")).toBe("Hi-Vis Yellow");
      expect(getReadableColorName("#111111")).toBe("Black");
      expect(getReadableColorName("#FFFFFF")).toBe("White");
      expect(getReadableColorName("#D4AF37")).toBe("Metallic Gold");
      expect(getReadableColorName("#2563EB")).toBe("Royal Blue");
      expect(getReadableColorName("#EA580C")).toBe("Vibrant Orange");
    });
  });

  describe("extractColorsFromCss", () => {
    it("deduplicates linear-gradient stops and extracts exact 2 colors for 2-tone split", () => {
      const gradient = "linear-gradient(135deg, #EAB308 0%, #EAB308 49.5%, #DC2626 50.5%, #DC2626 100%)";
      const colors = extractColorsFromCss(gradient);
      expect(colors).toEqual(["#EAB308", "#DC2626"]);
    });

    it("deduplicates 3-tone linear-gradient and extracts 3 colors", () => {
      const gradient = "linear-gradient(135deg, #009246 0%, #009246 32.8%, #FFFFFF 33.3%, #FFFFFF 66.1%, #CE2B37 66.6%, #CE2B37 100%)";
      const colors = extractColorsFromCss(gradient);
      expect(colors).toEqual(["#009246", "#FFFFFF", "#CE2B37"]);
    });

    it("deduplicates 4-tone linear-gradient and extracts 4 colors", () => {
      const gradient = "linear-gradient(135deg, #111111 0%, #111111 24.5%, #FFFFFF 25.5%, #FFFFFF 49.5%, #DC2626 50.5%, #DC2626 74.5%, #6B7280 75.5%, #6B7280 100%)";
      const colors = extractColorsFromCss(gradient);
      expect(colors).toEqual(["#111111", "#FFFFFF", "#DC2626", "#6B7280"]);
    });
  });
});
