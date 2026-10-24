import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContactService } from "../contact.service";
import { ContactRepository } from "../contact.repository";
import { NotFoundError, ValidationError } from "../../../core/errors/AppError";

vi.mock("../contact.repository");
vi.mock("../../../core/queue/email.queue", () => ({
  addEmailJob: vi.fn().mockResolvedValue(true),
}));
vi.mock("../../settings/setting.repository", () => ({
  SettingRepository: {
    getSettings: vi.fn().mockResolvedValue({ supportEmail: "contact@store4riders.com" }),
  },
}));
vi.mock("../../order/order.model", () => ({
  OrderModel: {
    findOne: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue({ _id: "order_123" }),
        }),
      }),
    }),
  },
}));

describe("ContactService - Customer Support Inquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitIssue", () => {
    it("successfully creates a new contact issue with generated ticketId", async () => {
      (ContactRepository.create as any).mockImplementation((data: any) => Promise.resolve({
        _id: "issue_001",
        ...data,
      }));

      const result = await ContactService.submitIssue({
        name: "Rahul Sharma",
        email: "rahul@example.com",
        phone: "9876543210",
        orderNumber: "#ORD-10023",
        category: "order_issue",
        subject: "Delivery status inquiry",
        message: "When will my helmet order be delivered?",
      });

      expect(ContactRepository.create).toHaveBeenCalled();
      expect(result.ticketId).toMatch(/^TKT-\d{8}-[A-F0-9]{6}$/);
      expect(result.name).toBe("Rahul Sharma");
      expect(result.email).toBe("rahul@example.com");
      expect(result.orderNumber).toBe("ORD-10023");
      expect(result.status).toBe("open");
    });
  });

  describe("getAllIssues", () => {
    it("delegates query to repository with search and filters", async () => {
      (ContactRepository.findPaginated as any).mockResolvedValue({
        items: [
          {
            id: "issue_001",
            ticketId: "TKT-20261024-ABCDEF",
            name: "Rahul Sharma",
            email: "rahul@example.com",
            status: "open",
          },
        ],
        total: 1,
      });

      const res = await ContactService.getAllIssues(
        { status: "open", search: "Rahul" },
        1,
        20
      );

      expect(ContactRepository.findPaginated).toHaveBeenCalled();
      expect(res.total).toBe(1);
      expect(res.items[0].ticketId).toBe("TKT-20261024-ABCDEF");
    });
  });

  describe("getIssueById", () => {
    it("returns issue if exists", async () => {
      (ContactRepository.findById as any).mockResolvedValue({
        _id: "issue_001",
        ticketId: "TKT-20261024-ABCDEF",
        name: "Rahul",
      });

      const res = await ContactService.getIssueById("issue_001");
      expect(res.id).toBe("issue_001");
      expect(res.ticketId).toBe("TKT-20261024-ABCDEF");
    });

    it("throws NotFoundError if issue does not exist", async () => {
      (ContactRepository.findById as any).mockResolvedValue(null);

      await expect(ContactService.getIssueById("non_existent")).rejects.toThrow(NotFoundError);
    });
  });

  describe("updateStatus", () => {
    it("updates issue status and returns updated document", async () => {
      (ContactRepository.updateStatus as any).mockResolvedValue({
        id: "issue_001",
        status: "resolved",
      });

      const updated: any = await ContactService.updateStatus(
        "issue_001",
        { status: "resolved", note: "Resolved over phone" },
        "Agent Vikram"
      );

      expect(ContactRepository.updateStatus).toHaveBeenCalledWith(
        "issue_001",
        "resolved",
        "Resolved over phone",
        "Agent Vikram"
      );
      expect(updated.status).toBe("resolved");
    });
  });

  describe("addNote", () => {
    it("adds internal staff note", async () => {
      (ContactRepository.addNote as any).mockResolvedValue({
        id: "issue_001",
        notes: [{ text: "Called customer", author: "Staff" }],
      });

      const res = await ContactService.addNote("issue_001", "Called customer", "Staff");
      expect(ContactRepository.addNote).toHaveBeenCalledWith("issue_001", "Called customer", "Staff");
      expect(res.id).toBe("issue_001");
    });

    it("throws ValidationError if note text is empty", async () => {
      await expect(ContactService.addNote("issue_001", "   ", "Staff")).rejects.toThrow(ValidationError);
    });
  });

  describe("getStats", () => {
    it("returns summary counts", async () => {
      (ContactRepository.getStats as any).mockResolvedValue({
        total: 10,
        open: 4,
        inProgress: 3,
        resolved: 2,
        closed: 1,
      });

      const stats = await ContactService.getStats();
      expect(stats.total).toBe(10);
      expect(stats.open).toBe(4);
    });
  });
});
