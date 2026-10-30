import { describe, it, expect } from "vitest";
import { generateVariantSku } from "../../tabs/ProductVariantsTab";

describe("generateVariantSku - Automatic Non-Colliding Variant SKU Engine", () => {
  it("generates standard SKU when color is Standard or empty", () => {
    const existing = new Set<string>();
    const sku = generateVariantSku("HLM", "Standard", "XS", existing);
    expect(sku).toBe("HLM-XS");
  });

  it("incorporates 3-letter uppercase color code for distinct colors", () => {
    const existing = new Set<string>();
    const sku = generateVariantSku("HLM", "Matte Black", "M", existing);
    expect(sku).toBe("HLM-MAT-M");
  });

  it("handles another color distinctly without collision", () => {
    const existing = new Set<string>(["HLM-MAT-M"]);
    const sku = generateVariantSku("HLM", "Gloss Red", "M", existing);
    expect(sku).toBe("HLM-GLO-M");
  });

  it("increments suffix if candidate SKU already exists in product table", () => {
    const existing = new Set<string>(["HLM-XS"]);
    const sku = generateVariantSku("HLM", "Standard", "XS", existing);
    expect(sku).toBe("HLM-XS-2");
  });

  it("increments higher if -2 already exists", () => {
    const existing = new Set<string>(["HLM-XS", "HLM-XS-2"]);
    const sku = generateVariantSku("HLM", "Standard", "XS", existing);
    expect(sku).toBe("HLM-XS-3");
  });

  it("falls back to 'SKU' if baseSku is omitted", () => {
    const existing = new Set<string>();
    const sku = generateVariantSku("", "brown", "L", existing);
    expect(sku).toBe("SKU-BRO-L");
  });
});
