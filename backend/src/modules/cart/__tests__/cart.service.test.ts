import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartService } from "../cart.service";
import { CartRepository } from "../cart.repository";
import { ProductRepository } from "../../product/product.repository";
import { SettingRepository } from "../../settings/setting.repository";
import { removeCartItemSchema, updateCartItemSchema } from "@store4riders/shared-validation";

vi.mock("../cart.repository");
vi.mock("../../product/product.repository");
vi.mock("../../settings/setting.repository");

describe("CartService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SettingRepository.getSettings).mockResolvedValue({
      gstPricingMode: "inclusive",
      freeShippingThreshold: 1000,
      shippingCost: 100,
      taxRate: 18,
    } as any);

    vi.mocked(ProductRepository.findById).mockImplementation(async (id: string) => ({
      _id: id,
      id: id,
      name: `Product ${id}`,
      basePrice: 5000,
      specialPrice: null,
      images: [{ id: "img-1", url: "/img.jpg", altText: "Jacket" }],
      slug: `product-${id}`,
      taxClassName: "Standard",
      allowBackorders: false,
    } as any));
  });

  it("should remove item by itemId correctly and persist clean data", async () => {
    const existingCart = {
      _id: "cart-doc-123",
      userId: "user-1",
      items: [
        { id: "item-1", productId: "prod-1", variantId: "var-1", quantity: 1 },
        { id: "item-2", productId: "prod-2", variantId: "var-2", quantity: 2 },
      ],
      summary: { subtotal: 5000, tax: 0, shipping: 0, total: 5000 },
    };

    vi.mocked(CartRepository.findByUserId).mockResolvedValue(existingCart as any);
    vi.mocked(CartRepository.upsert).mockImplementation(async (userId, data) => data as any);

    const result = await CartService.removeItem("user-1", "prod-1", "var-1", "item-1");

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("item-2");
    expect(CartRepository.upsert).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ id: "item-2" })]),
      })
    );
  });

  it("should remove item by productId when variant is null or undefined", async () => {
    const existingCart = {
      _id: "cart-doc-123",
      userId: "user-1",
      items: [
        { id: "item-1", productId: "prod-1", variantId: undefined, quantity: 1 },
        { id: "item-2", productId: "prod-2", variantId: "var-2", quantity: 2 },
      ],
      summary: { subtotal: 5000, tax: 0, shipping: 0, total: 5000 },
    };

    vi.mocked(CartRepository.findByUserId).mockResolvedValue(existingCart as any);
    vi.mocked(CartRepository.upsert).mockImplementation(async (userId, data) => data as any);

    // Call removeItem with null variantId
    const result = await CartService.removeItem("user-1", "prod-1", null);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("item-2");
  });

  it("should remove item when updateQuantity is called with quantity <= 0", async () => {
    const existingCart = {
      _id: "cart-doc-123",
      userId: "user-1",
      items: [
        { id: "item-1", productId: "prod-1", variantId: "var-1", quantity: 1 },
      ],
      summary: { subtotal: 5000, tax: 0, shipping: 0, total: 5000 },
    };

    vi.mocked(CartRepository.findByUserId).mockResolvedValue(existingCart as any);
    vi.mocked(CartRepository.upsert).mockImplementation(async (userId, data) => data as any);

    const result = await CartService.updateQuantity("user-1", "prod-1", 0, "var-1");

    expect(result.items).toHaveLength(0);
  });

  it("should successfully parse removeCartItemSchema with null variantId and itemId", () => {
    const payload = {
      productId: "prod-123",
      variantId: null,
      itemId: null,
    };

    const parsed = removeCartItemSchema.parse(payload);
    expect(parsed.productId).toBe("prod-123");
    expect(parsed.variantId).toBeNull();
    expect(parsed.itemId).toBeNull();
  });

  it("should successfully parse updateCartItemSchema with null variantId", () => {
    const payload = {
      productId: "prod-123",
      variantId: null,
      quantity: 3,
    };

    const parsed = updateCartItemSchema.parse(payload);
    expect(parsed.productId).toBe("prod-123");
    expect(parsed.variantId).toBeNull();
    expect(parsed.quantity).toBe(3);
  });
});
