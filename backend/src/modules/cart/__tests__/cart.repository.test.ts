import { describe, it, expect, vi, beforeEach } from "vitest";
import { CartRepository } from "../cart.repository";
import { CartModel } from "../cart.model";

vi.mock("../cart.model", () => ({
  CartModel: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

describe("CartRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should strip immutable _id, createdAt, updatedAt, and __v before updating MongoDB", async () => {
    const mockExec = vi.fn().mockResolvedValue({ userId: "u123", items: [] });
    const mockLean = vi.fn().mockReturnValue({ exec: mockExec });
    vi.mocked(CartModel.findOneAndUpdate).mockReturnValue({ lean: mockLean } as any);

    const dataToSave = {
      _id: "661234567890abcdef123456",
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
      userId: "u123",
      items: [{ productId: "p1", quantity: 1 }],
      summary: { subtotal: 100, tax: 0, shipping: 0, total: 100 },
    };

    await CartRepository.upsert("u123", dataToSave as any);

    expect(CartModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "u123" },
      {
        $set: {
          userId: "u123",
          items: [{ productId: "p1", quantity: 1 }],
          summary: { subtotal: 100, tax: 0, shipping: 0, total: 100 },
        },
      },
      { new: true, upsert: true }
    );
  });
});
