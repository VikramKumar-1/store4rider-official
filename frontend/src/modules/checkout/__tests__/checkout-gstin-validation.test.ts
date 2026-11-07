import { describe, it, expect } from "vitest";
import { createOrderSchema, GSTIN_REGEX } from "@store4riders/shared-validation";

describe("100% Robust GSTIN Validation Suite", () => {
  describe("1. GSTIN Regex Pattern Verification", () => {
    it("should accept valid standard 15-digit Indian GSTINs", () => {
      const validGstins = [
        "27AAPCS1234F1Z5", // Maharashtra standard format
        "29ABCDE1234F1Z5", // Karnataka standard format
        "07AAAAA0000A1Z5", // Delhi standard format
        "33GSPTN1234H1Z1", // Tamil Nadu standard format
        "06AAACB1234C1Z9", // Haryana standard format
      ];

      validGstins.forEach((gstin) => {
        expect(GSTIN_REGEX.test(gstin)).toBe(true);
      });
    });

    it("should reject malformed or invalid GSTINs", () => {
      const invalidGstins = [
        "12345",                    // Too short
        "INVALID_GSTIN",            // Not matching structure
        "27AAPCS1234F1Z",           // 14 digits (missing last check char)
        "27AAPCS1234F1Z55",         // 16 digits (too long)
        "2712345678F1Z5",           // Missing 5-letter PAN format
        "27AAPCS123411Z5",          // PAN 10th char must be letter
        "27AAPCS1234FZ15",          // 14th char must be Z
        "A7AAPCS1234F1Z5",          // First 2 must be numeric state code
      ];

      invalidGstins.forEach((gstin) => {
        expect(GSTIN_REGEX.test(gstin)).toBe(false);
      });
    });
  });

  describe("2. Shared Zod Schema (createOrderSchema) Guard", () => {
    const baseValidOrder = {
      shippingAddress: {
        fullName: "Rahul Sharma",
        phone: "+919876543210",
        street: "101 High Street",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
        country: "India",
      },
      paymentMethod: "payu" as const,
    };

    it("should allow normal B2C orders without GSTIN or with null/undefined", () => {
      const parsedWithoutGst = createOrderSchema.safeParse(baseValidOrder);
      expect(parsedWithoutGst.success).toBe(true);

      const parsedWithNull = createOrderSchema.safeParse({
        ...baseValidOrder,
        customerGstin: null,
        businessName: null,
      });
      expect(parsedWithNull.success).toBe(true);
    });

    it("should accept valid B2B orders with valid GSTIN and businessName", () => {
      const parsedB2b = createOrderSchema.safeParse({
        ...baseValidOrder,
        customerGstin: "27AAPCS1234F1Z5",
        businessName: "Speedway Motors Pvt Ltd",
      });
      expect(parsedB2b.success).toBe(true);
    });

    it("should accept lowercase / padded GSTIN and validate after trim/upper", () => {
      const parsedLowercase = createOrderSchema.safeParse({
        ...baseValidOrder,
        customerGstin: "  27aapcs1234f1z5  ",
        businessName: "Speedway Motors",
      });
      expect(parsedLowercase.success).toBe(true);
    });

    it("should reject B2B order if GSTIN format is invalid", () => {
      const parsedInvalidGstin = createOrderSchema.safeParse({
        ...baseValidOrder,
        customerGstin: "123456789",
        businessName: "Speedway Motors",
      });
      expect(parsedInvalidGstin.success).toBe(false);
      if (!parsedInvalidGstin.success) {
        expect(parsedInvalidGstin.error.issues[0].message).toContain("Invalid 15-digit GSTIN format");
      }
    });

    it("should reject B2B order if GSTIN is provided but businessName is missing", () => {
      const parsedMissingName = createOrderSchema.safeParse({
        ...baseValidOrder,
        customerGstin: "27AAPCS1234F1Z5",
        businessName: "",
      });
      expect(parsedMissingName.success).toBe(false);
      if (!parsedMissingName.success) {
        expect(parsedMissingName.error.issues[0].message).toContain("Company / Business Name is required");
      }
    });
  });

  describe("3. Frontend Checkout Step Validation Logic", () => {
    // Pure function representing validateStep1 logic from CheckoutPageModule
    const validateCheckoutStep1 = (formData: {
      name: string;
      email: string;
      phone: string;
      isB2b?: boolean;
      businessName?: string;
      customerGstin?: string;
    }) => {
      const errors: Record<string, string> = {};

      if (!formData.name?.trim()) errors.name = "Please provide your name.";
      if (!formData.email?.trim()) errors.email = "Please provide your email address.";
      if (!formData.phone?.trim()) errors.phone = "Please provide your phone number.";

      if (formData.isB2b) {
        if (!formData.businessName || !formData.businessName.trim()) {
          errors.businessName = "Please provide your company / business name.";
        } else if (formData.businessName.trim().length < 2 || formData.businessName.trim().length > 100) {
          errors.businessName = "Business name must be between 2 and 100 characters.";
        }

        const gstinClean = (formData.customerGstin || "").trim().toUpperCase();
        if (!gstinClean) {
          errors.customerGstin = "Please provide your 15-digit Company GSTIN.";
        } else if (!GSTIN_REGEX.test(gstinClean)) {
          errors.customerGstin = "Invalid 15-digit GSTIN format (e.g. 27AAPCS1234F1Z5).";
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    };

    it("should pass for valid B2C customer", () => {
      const res = validateCheckoutStep1({
        name: "Vikram Kumar",
        email: "rider@store4riders.com",
        phone: "9876543210",
        isB2b: false,
      });
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual({});
    });

    it("should fail if B2B is enabled but businessName is empty", () => {
      const res = validateCheckoutStep1({
        name: "Vikram Kumar",
        email: "rider@store4riders.com",
        phone: "9876543210",
        isB2b: true,
        businessName: "",
        customerGstin: "27AAPCS1234F1Z5",
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.businessName).toBe("Please provide your company / business name.");
    });

    it("should fail if B2B is enabled but businessName is too short (< 2 chars)", () => {
      const res = validateCheckoutStep1({
        name: "Vikram Kumar",
        email: "rider@store4riders.com",
        phone: "9876543210",
        isB2b: true,
        businessName: "A",
        customerGstin: "27AAPCS1234F1Z5",
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.businessName).toBe("Business name must be between 2 and 100 characters.");
    });

    it("should fail if B2B is enabled but customerGstin is empty", () => {
      const res = validateCheckoutStep1({
        name: "Vikram Kumar",
        email: "rider@store4riders.com",
        phone: "9876543210",
        isB2b: true,
        businessName: "Acme Riders LLP",
        customerGstin: "",
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.customerGstin).toBe("Please provide your 15-digit Company GSTIN.");
    });

    it("should fail if B2B is enabled but customerGstin format is invalid", () => {
      const res = validateCheckoutStep1({
        name: "Vikram Kumar",
        email: "rider@store4riders.com",
        phone: "9876543210",
        isB2b: true,
        businessName: "Acme Riders LLP",
        customerGstin: "9999999999",
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.customerGstin).toBe("Invalid 15-digit GSTIN format (e.g. 27AAPCS1234F1Z5).");
    });

    it("should pass when B2B fields are all valid", () => {
      const res = validateCheckoutStep1({
        name: "Vikram Kumar",
        email: "rider@store4riders.com",
        phone: "9876543210",
        isB2b: true,
        businessName: "Acme Riders LLP",
        customerGstin: "27AAPCS1234F1Z5",
      });
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual({});
    });
  });
});
