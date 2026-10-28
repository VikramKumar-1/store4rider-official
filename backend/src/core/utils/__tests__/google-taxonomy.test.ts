import { describe, it, expect } from "vitest";
import {
  getGoogleProductCategory,
  DEFAULT_GOOGLE_CATEGORY,
  GOOGLE_PRODUCT_TAXONOMY,
} from "@store4riders/shared-utils";

describe("Google Product Taxonomy Mapping", () => {
  it("should return the default motorcycle protective gear category for empty or undefined input", () => {
    expect(getGoogleProductCategory()).toEqual(DEFAULT_GOOGLE_CATEGORY);
    expect(getGoogleProductCategory("")).toEqual(DEFAULT_GOOGLE_CATEGORY);
    expect(getGoogleProductCategory("   ")).toEqual(DEFAULT_GOOGLE_CATEGORY);
  });

  it("should map helmet categories to Google ID 8094", () => {
    const helmetResult = getGoogleProductCategory("Motorcycle Helmets");
    expect(helmetResult.id).toBe(8094);
    expect(helmetResult.path).toContain("Motorcycle Helmets");

    const fullFaceResult = getGoogleProductCategory("full-face-helmets");
    expect(fullFaceResult.id).toBe(8094);

    const modularResult = getGoogleProductCategory("Modular Helmets");
    expect(modularResult.id).toBe(8094);
  });

  it("should map jacket categories to Google ID 8095", () => {
    const jacketResult = getGoogleProductCategory("Riding Jackets");
    expect(jacketResult.id).toBe(8095);
    expect(jacketResult.path).toContain("Motorcycle Jackets");

    const leatherResult = getGoogleProductCategory("leather-jackets");
    expect(leatherResult.id).toBe(8095);
  });

  it("should map pants categories to Google ID 8096", () => {
    const pantsResult = getGoogleProductCategory("Riding Pants");
    expect(pantsResult.id).toBe(8096);
    expect(pantsResult.path).toContain("Motorcycle Pants");
  });

  it("should map gloves categories to Google ID 8097", () => {
    const glovesResult = getGoogleProductCategory("Riding Gloves");
    expect(glovesResult.id).toBe(8097);
    expect(glovesResult.path).toContain("Motorcycle Gloves");
  });

  it("should map boots categories to Google ID 8098", () => {
    const bootsResult = getGoogleProductCategory("motorcycle-riding-boots");
    expect(bootsResult.id).toBe(8098);
    expect(bootsResult.path).toContain("Motorcycle Boots");
  });

  it("should map luggage categories to Google ID 5971", () => {
    const luggageResult = getGoogleProductCategory("saddlebags");
    expect(luggageResult.id).toBe(5971);
    expect(luggageResult.path).toContain("Motor Vehicle Carrying Systems & Racks");
  });

  it("should map electronics and intercoms to Google ID 935", () => {
    const intercomResult = getGoogleProductCategory("intercoms");
    expect(intercomResult.id).toBe(935);
    expect(intercomResult.path).toContain("Motor Vehicle Electronics");
  });

  it("should map bike spares to Google ID 5613", () => {
    const spareResult = getGoogleProductCategory("bike-spares");
    expect(spareResult.id).toBe(5613);
    expect(spareResult.path).toContain("Motor Vehicle Parts");
  });

  it("should fallback gracefully using keyword matching", () => {
    expect(getGoogleProductCategory("Cool Winter Riding Gloves").id).toBe(8097);
    expect(getGoogleProductCategory("Aerodynamic Track Helmet").id).toBe(8094);
    expect(getGoogleProductCategory("Adventure Touring Pants").id).toBe(8096);
  });
});
