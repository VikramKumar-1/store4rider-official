import { describe, it, expect, vi, beforeEach } from "vitest";
import { CouponService } from "../coupon.service";
import { CouponRepository } from "../coupon.repository";
import { OrderRepository } from "../../order/order.repository";
import { ProductRepository } from "../../product/product.repository";

vi.mock("../coupon.repository");
vi.mock("../../order/order.repository");
vi.mock("../../product/product.repository");

describe("CouponService - Robust Validation & Guardrails", () => {
  const TEST_USER_ID = "user_test_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Strict Authentication Check (Guest Blocked)
  it("throws 401 Unauthorized if guest user (unauthenticated) attempts to apply coupon", async () => {
    await expect(
      CouponService.validateCoupon({
        code: "WELCOME10",
        cartTotal: 2000,
        userId: undefined, // Guest attempt
      })
    ).rejects.toThrow("Please sign in or create an account to apply promo coupons");
  });

  // 2. Percentage discount & Cap
  it("calculates percentage discount correctly and caps at maxDiscountCap", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "SAVE20",
      discountType: "percent",
      discountValue: 20,
      maxDiscountCap: 500, // Max cap ₹500
      minPurchase: 1000,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 0,
      excludeSaleItems: false,
      firstOrderOnly: false,
    } as any);

    const result = await CouponService.validateCoupon({
      code: "SAVE20",
      cartTotal: 4000, // 20% of 4000 = 800, but cap is 500
      userId: TEST_USER_ID,
    });

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(500);
    expect(result.code).toBe("SAVE20");
  });

  // 3. Flat discount
  it("calculates flat fixed discount correctly", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "FLAT300",
      discountType: "fixed",
      discountValue: 300,
      minPurchase: 1500,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    const result = await CouponService.validateCoupon({
      code: "FLAT300",
      cartTotal: 2500,
      userId: TEST_USER_ID,
    });

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(300);
  });

  // 4. Inactive check
  it("throws error if coupon is marked inactive by admin", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "INACTIVE10",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: false, // Disabled
    } as any);

    await expect(
      CouponService.validateCoupon({ code: "INACTIVE10", cartTotal: 2000, userId: TEST_USER_ID })
    ).rejects.toThrow("Coupon is currently inactive");
  });

  // 5. Expired check
  it("throws error if coupon is expired", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "OLDPROMO",
      discountType: "fixed",
      discountValue: 200,
      minPurchase: 0,
      expiryDate: new Date(Date.now() - 86400000), // Expired yesterday
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    await expect(
      CouponService.validateCoupon({ code: "OLDPROMO", cartTotal: 2000, userId: TEST_USER_ID })
    ).rejects.toThrow("This coupon has expired");
  });

  // 6. Future start date check
  it("throws error if start date is in the future", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "FUTURE50",
      discountType: "fixed",
      discountValue: 50,
      minPurchase: 0,
      startDate: new Date(Date.now() + 86400000), // Starts tomorrow
      expiryDate: new Date(Date.now() + 86400000 * 5),
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    await expect(
      CouponService.validateCoupon({ code: "FUTURE50", cartTotal: 1000, userId: TEST_USER_ID })
    ).rejects.toThrow("This coupon is not active yet");
  });

  // 7. Global total redemptions limit check
  it("throws error if global total usage limit is reached", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "FIRST100",
      discountType: "percent",
      discountValue: 15,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      totalUsageLimit: 100,
      usageCount: 100, // Limit reached
    } as any);

    await expect(
      CouponService.validateCoupon({ code: "FIRST100", cartTotal: 2000, userId: TEST_USER_ID })
    ).rejects.toThrow("This coupon has reached its maximum total redemptions limit");
  });

  // 8. Minimum purchase check
  it("throws error if minimum purchase threshold is not met", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "MIN5000",
      discountType: "fixed",
      discountValue: 500,
      minPurchase: 5000,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    await expect(
      CouponService.validateCoupon({ code: "MIN5000", cartTotal: 2500, userId: TEST_USER_ID })
    ).rejects.toThrow("Minimum purchase of ₹5,000 required");
  });

  // 9. Per-user redemption limit check
  it("enforces per-user limit when customer has already used it", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "ONCEONLY",
      discountType: "fixed",
      discountValue: 100,
      minPurchase: 500,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 10,
    } as any);

    vi.mocked(OrderRepository.countUserCouponUsage).mockResolvedValue(1); // Already used once

    await expect(
      CouponService.validateCoupon({
        code: "ONCEONLY",
        cartTotal: 1000,
        userId: TEST_USER_ID,
      })
    ).rejects.toThrow("You have already used this coupon");
  });

  // 10. First order only for returning user check
  it("enforces first-order-only requirement for returning customer", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "FIRSTORDER",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 500,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      firstOrderOnly: true,
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    vi.mocked(OrderRepository.countUserCouponUsage).mockResolvedValue(0);
    vi.mocked(OrderRepository.countUserOrders).mockResolvedValue(2); // Has 2 previous orders

    await expect(
      CouponService.validateCoupon({
        code: "FIRSTORDER",
        cartTotal: 2000,
        userId: TEST_USER_ID,
      })
    ).rejects.toThrow("This coupon is valid only on your first purchase");
  });

  // 11. First order allowed for new customer
  it("allows first-order-only coupon for customer with 0 past orders", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "FIRSTORDER",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 500,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      firstOrderOnly: true,
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    vi.mocked(OrderRepository.countUserCouponUsage).mockResolvedValue(0);
    vi.mocked(OrderRepository.countUserOrders).mockResolvedValue(0); // 0 previous orders

    const result = await CouponService.validateCoupon({
      code: "FIRSTORDER",
      cartTotal: 2000,
      userId: TEST_USER_ID,
    });

    expect(result.isValid).toBe(true);
    expect(result.discountAmount).toBe(200);
  });

  // 12. Exclude sale items check: entire cart on sale
  it("prevents double-discounting when excludeSaleItems is true and all items are on sale", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "FULLPRICEONLY",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 500,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      excludeSaleItems: true, // Do not discount sale items
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    // Product is on sale (basePrice 2000, specialPrice 1500)
    vi.mocked(ProductRepository.findById).mockResolvedValue({
      basePrice: 2000,
      specialPrice: 1500,
      brand: "SMK",
    } as any);

    await expect(
      CouponService.validateCoupon({
        code: "FULLPRICEONLY",
        items: [{ productId: "prod_sale", quantity: 1 }],
        userId: TEST_USER_ID,
      })
    ).rejects.toThrow("This coupon cannot be combined with items already on sale or discounted");
  });

  // 13. Exclude sale items check: mixed cart
  it("calculates discount only on non-sale items when excludeSaleItems is true in mixed cart", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "MIXEDSAFE",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      excludeSaleItems: true, // Item 2 should be skipped
    } as any);

    // Item 1: Full price item (₹4,000)
    vi.mocked(ProductRepository.findById).mockImplementation(async (id: string) => {
      if (id === "item_full") {
        return { basePrice: 4000 } as any;
      }
      if (id === "item_sale") {
        return { basePrice: 3000, specialPrice: 2000 } as any; // On sale
      }
      return null;
    });

    const result = await CouponService.validateCoupon({
      code: "MIXEDSAFE",
      items: [
        { productId: "item_full", quantity: 1 },
        { productId: "item_sale", quantity: 1 },
      ],
      userId: TEST_USER_ID,
    });

    // Discount must ONLY apply to item_full (10% of 4000 = 400)
    expect(result.isValid).toBe(true);
    expect(result.eligibleSubtotal).toBe(4000);
    expect(result.discountAmount).toBe(400);
  });

  // 14. Brand scope: mixed cart
  it("calculates discount only on matching brand items in brand-specific coupon", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "ALPINE20",
      discountType: "percent",
      discountValue: 20,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "brand",
      applicableBrands: ["Alpinestars"],
    } as any);

    vi.mocked(ProductRepository.findById).mockImplementation(async (id: string) => {
      if (id === "alpine_jacket") {
        return { basePrice: 10000, brand: "Alpinestars" } as any;
      }
      if (id === "smk_helmet") {
        return { basePrice: 5000, brand: "SMK" } as any;
      }
      return null;
    });

    const result = await CouponService.validateCoupon({
      code: "ALPINE20",
      items: [
        { productId: "alpine_jacket", quantity: 1 },
        { productId: "smk_helmet", quantity: 1 },
      ],
      userId: TEST_USER_ID,
    });

    // Discount must ONLY apply to Alpinestars item (20% of 10000 = 2000), NOT SMK helmet
    expect(result.isValid).toBe(true);
    expect(result.eligibleSubtotal).toBe(10000);
    expect(result.discountAmount).toBe(2000);
  });

  // 15. Brand scope: no matching items
  it("throws error if brand-specific coupon cart contains no matching brand items", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "SMK10",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "brand",
      applicableBrands: ["SMK"],
    } as any);

    vi.mocked(ProductRepository.findById).mockResolvedValue({
      basePrice: 5000,
      brand: "Axor",
    } as any);

    await expect(
      CouponService.validateCoupon({
        code: "SMK10",
        items: [{ productId: "axor_helmet", quantity: 1 }],
        userId: TEST_USER_ID,
      })
    ).rejects.toThrow("This coupon is valid only for selected brands");
  });

  // 16. Hard Floor Guardrail (Zero / Negative cart prevention)
  it("prevents price from becoming negative when flat discount exceeds subtotal", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "BIGFLAT",
      discountType: "fixed",
      discountValue: 5000, // Flat 5000 off
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
      usageLimitPerUser: 1,
      usageCount: 0,
    } as any);

    const result = await CouponService.validateCoupon({
      code: "BIGFLAT",
      cartTotal: 3000, // Order total is only 3000
      userId: TEST_USER_ID,
    });

    // Discount must be capped at 3000, never exceeding eligible total
    expect(result.discountAmount).toBe(3000);
  });

  // 17. Case insensitivity and whitespace trimming
  it("trims whitespace and handles lowercase coupon input seamlessly", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "TRIMME",
      discountType: "fixed",
      discountValue: 150,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
    } as any);

    const result = await CouponService.validateCoupon({
      code: "   trimme   ",
      cartTotal: 1000,
      userId: TEST_USER_ID,
    });

    expect(result.isValid).toBe(true);
    expect(result.code).toBe("TRIMME");
    expect(result.discountAmount).toBe(150);
  });

  // 18. Missing or deleted product in cart items
  it("skips deleted or missing product gracefully without throwing 500 crash", async () => {
    vi.mocked(CouponRepository.findByCode).mockResolvedValue({
      code: "STORE10",
      discountType: "percent",
      discountValue: 10,
      minPurchase: 0,
      expiryDate: new Date(Date.now() + 86400000),
      isActive: true,
      scope: "all",
    } as any);

    vi.mocked(ProductRepository.findById).mockImplementation(async (id: string) => {
      if (id === "existing_item") return { basePrice: 2000 } as any;
      return null; // Missing/deleted item
    });

    const result = await CouponService.validateCoupon({
      code: "STORE10",
      items: [
        { productId: "deleted_item", quantity: 1 },
        { productId: "existing_item", quantity: 1 },
      ],
      userId: TEST_USER_ID,
    });

    expect(result.isValid).toBe(true);
    expect(result.eligibleSubtotal).toBe(2000);
    expect(result.discountAmount).toBe(200);
  });
});
