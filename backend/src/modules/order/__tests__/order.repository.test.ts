import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderRepository } from "../order.repository";
import { OrderModel } from "../order.model";

vi.mock("../order.model", () => ({
  OrderModel: {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

describe("OrderRepository - linkGuestOrders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 immediately if email or userId is missing", async () => {
    const res1 = await OrderRepository.linkGuestOrders("", "user_123");
    const res2 = await OrderRepository.linkGuestOrders("test@example.com", "");
    expect(res1).toBe(0);
    expect(res2).toBe(0);
    expect(OrderModel.updateMany).not.toHaveBeenCalled();
  });

  it("should perform case-insensitive regex query on guestEmail and shippingAddress.email for unassigned orders", async () => {
    const mockExec = vi.fn().mockResolvedValue({
      modifiedCount: 3,
      acknowledged: true,
      matchedCount: 3,
      upsertedCount: 0,
      upsertedId: null,
    });
    vi.mocked(OrderModel.updateMany).mockReturnValue({ exec: mockExec } as any);

    const count = await OrderRepository.linkGuestOrders("Rider.John@Example.COM", "user_abc_789");

    expect(count).toBe(3);
    expect(OrderModel.updateMany).toHaveBeenCalledTimes(1);

    const [calledFilterRaw, calledUpdateRaw] = vi.mocked(OrderModel.updateMany).mock.calls[0];
    const calledFilter = calledFilterRaw as any;
    const calledUpdate = calledUpdateRaw as any;

    // Filter assertions
    expect(calledFilter.$and).toHaveLength(2);

    const emailCondition = calledFilter.$and[0];
    expect(emailCondition.$or).toBeDefined();
    expect(emailCondition.$or[0].guestEmail.source).toBe("^Rider\\.John@Example\\.COM$");
    expect(emailCondition.$or[0].guestEmail.flags).toContain("i");
    expect(emailCondition.$or[1]["shippingAddress.email"].source).toBe("^Rider\\.John@Example\\.COM$");

    const userIdCondition = calledFilter.$and[1];
    expect(userIdCondition.$or).toEqual([
      { userId: { $exists: false } },
      { userId: null },
      { userId: "" },
    ]);

    // Update assertions
    expect(calledUpdate).toEqual({
      $set: {
        userId: "user_abc_789",
        guestEmail: "rider.john@example.com",
      },
    });
  });

  it("should return 0 if no orders were modified", async () => {
    const mockExec = vi.fn().mockResolvedValue({
      modifiedCount: 0,
      acknowledged: true,
      matchedCount: 0,
      upsertedCount: 0,
      upsertedId: null,
    });
    vi.mocked(OrderModel.updateMany).mockReturnValue({ exec: mockExec } as any);

    const count = await OrderRepository.linkGuestOrders("nomatch@example.com", "user_xyz");
    expect(count).toBe(0);
  });
});
