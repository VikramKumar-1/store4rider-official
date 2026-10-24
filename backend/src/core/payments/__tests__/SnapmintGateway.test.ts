import { describe, it, expect, vi, beforeEach } from "vitest";
import { SnapmintGateway } from "../SnapmintGateway";
import { AppError } from "../../errors/AppError";

vi.mock("../../config/env", () => ({
  ENV: {
    SNAPMINT_MERCHANT_ID: "nLRGPKDo",
    SNAPMINT_SECRET: "WiG-6A3P",
    SNAPMINT_MID: "2025",
    SNAPMINT_MODE: "test",
    NEXT_PUBLIC_API_URL: "http://localhost:4000",
    API_URL: "http://localhost:4000",
    FRONTEND_URL: "http://localhost:3000",
  },
}));

describe("SnapmintGateway — Checkout 3.0 S2S Integration", () => {
  let gateway: SnapmintGateway;

  beforeEach(() => {
    gateway = new SnapmintGateway();
    vi.clearAllMocks();
  });

  const mockOrder: any = {
    orderNumber: "ORD-2026-0001",
    id: "ord_mongo_123",
    userEmail: "rider@store4riders.com",
    shippingAddress: {
      fullName: "Vikram Kumar",
      phone: "+91 9876543210",
      street: "123 Riders Lane",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    },
    items: [
      {
        sku: "HLMT-AGV-K6",
        name: "AGV K6 S Helmet",
        quantity: 1,
        unitPrice: 45000,
      },
    ],
  };

  describe("createOrder — S2S Session Creation", () => {
    it("should POST to Snapmint carts API and return checkout redirect URL", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "Success",
          url: "https://pay.snapmint.com?id=153842263&token=testToken&merchantId=2025",
          redirect_url: "https://pay.snapmint.com?id=153842263&token=testToken&merchantId=2025",
        }),
      } as any);

      const result = await gateway.createOrder(mockOrder, 45000);

      expect(result.gatewayOrderId).toBe("ORD-2026-0001");
      expect(result.gatewayResponse.redirectUrl).toBe(
        "https://pay.snapmint.com?id=153842263&token=testToken&merchantId=2025"
      );

      // Verify S2S request format
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0]!;
      expect(url).toBe("https://apis.snapmint.com/api/pub/carts");
      expect(options!.method).toBe("POST");

      const body = JSON.parse(options!.body as string);
      expect(body.merchantId).toBe("2025");
      expect(body.merchantPassword).toBe("WiG-6A3P");
      expect(body.merchantOrderId).toBe("ORD-2026-0001");
      expect(body.orderValue).toBe("45000");
      expect(body.mobile).toBe("9876543210");
      expect(body.full_name).toBe("Vikram Kumar");
      expect(body.products).toHaveLength(1);
      expect(body.products[0].sku).toBe("HLMT-AGV-K6");
      expect(body.merchantConfirmationUrl).toContain("/webhook/snapmint/success");
      expect(body.merchantFailureUrl).toContain("/webhook/snapmint/failure");

      fetchSpy.mockRestore();
    });

    it("should reject checkout if customer phone number is invalid / missing", async () => {
      const invalidOrder = {
        ...mockOrder,
        shippingAddress: {
          ...mockOrder.shippingAddress,
          phone: "123", // Invalid phone
        },
      };

      await expect(gateway.createOrder(invalidOrder, 45000)).rejects.toThrow(
        "A valid 10-digit Indian mobile number is mandatory"
      );
    });

    it("should handle ORDER_VALUE_LT_MIN error gracefully", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          status: "Failed",
          code: "ORDER_VALUE_LT_MIN",
          message: "Order value is less than minimum eligible amount",
        }),
      } as any);

      await expect(gateway.createOrder(mockOrder, 3000)).rejects.toThrow(
        /orders above ₹25,000/
      );

      fetchSpy.mockRestore();
    });

    it("should handle DUPLICATE_MERCHANT_OID conflict", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          status: "Failed",
          code: "DUPLICATE_MERCHANT_OID",
          message: "Order with this merchant order id already exists",
        }),
      } as any);

      await expect(gateway.createOrder(mockOrder, 45000)).rejects.toThrow(
        /already been submitted to Snapmint/
      );

      fetchSpy.mockRestore();
    });

    it("should handle network exception gracefully", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValue(new Error("Connection refused"));

      await expect(gateway.createOrder(mockOrder, 45000)).rejects.toThrow(
        /Snapmint service unavailable/
      );

      fetchSpy.mockRestore();
    });
  });

  describe("verifyPayment — Callback Verification", () => {
    it("should succeed when status is Success", async () => {
      const mockPayment: any = { amount: 45000 };
      const verificationData = {
        status: "Success",
        id: "153842263",
        token: "snap_token_123",
        message: "Success",
      };

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      expect(result.success).toBe(true);
      expect(result.gatewayPaymentId).toBe("153842263");
      expect(result.message).toBe("Payment verified successfully");
    });

    it("should fail when status is Failed", async () => {
      const mockPayment: any = { amount: 45000 };
      const verificationData = {
        status: "Failed",
        id: "153842263",
        message: "Customer rejected EMI terms",
      };

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Payment rejected with status: Failed");
    });

    it("should fail when status is missing", async () => {
      const mockPayment: any = { amount: 45000 };
      const result = await gateway.verifyPayment(mockPayment, {});
      expect(result.success).toBe(false);
      expect(result.message).toBe("Missing Snapmint payment status");
    });
  });

  describe("handleWebhook — Callback & Webhook Processing", () => {
    it("should emit payment.captured on successful JSON payload", async () => {
      const webhookBody = {
        status: "Success",
        merchantOrderId: "ORD-2026-0001",
        id: "153842263",
        token: "tok_xyz",
        orderValue: "45000",
        message: "Success",
      };

      const result = await gateway.handleWebhook({}, JSON.stringify(webhookBody));
      expect(result.event).toBe("payment.captured");
      expect(result.gatewayOrderId).toBe("ORD-2026-0001");
      expect(result.id).toBe("153842263");
      expect(result.payload.amount).toBe(45000);
    });

    it("should handle URL-encoded query parameters from redirect callback", async () => {
      const queryParams = "status=Success&merchant_order_id=ORD-2026-0001&id=153842263&order_value=45000&message=Success";

      const result = await gateway.handleWebhook({}, queryParams);
      expect(result.event).toBe("payment.captured");
      expect(result.gatewayOrderId).toBe("ORD-2026-0001");
      expect(result.id).toBe("153842263");
      expect(result.payload.amount).toBe(45000);
    });

    it("should emit payment.failed when transaction status is not successful", async () => {
      const webhookBody = {
        status: "Failed",
        merchantOrderId: "ORD-2026-0001",
        id: "153842263",
        message: "Cardless EMI declined",
      };

      const result = await gateway.handleWebhook({}, JSON.stringify(webhookBody));
      expect(result.event).toBe("payment.failed");
      expect(result.gatewayOrderId).toBe("ORD-2026-0001");
    });

    it("should throw AppError when payload is missing order ID and transaction ID", async () => {
      const emptyPayload = { status: "Success" };
      await expect(gateway.handleWebhook({}, JSON.stringify(emptyPayload))).rejects.toThrow(
        "Invalid Snapmint webhook payload"
      );
    });
  });

  describe("getPaymentStatus & initiateRefund", () => {
    it("should handle network exception during getPaymentStatus gracefully", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network timeout"));

      const result = await gateway.getPaymentStatus("ORD-2026-0001");
      expect(result.status).toBe("network_error");
      expect(result.error).toBe("Network timeout");

      fetchSpy.mockRestore();
    });

    it("should execute refund via S2S API and return refund ID", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          status: "refunded",
          refund_id: "snap_ref_777",
          message: "Refund processed successfully",
        }),
      } as any);

      const mockPayment: any = {
        amount: 45000,
        gatewayOrderId: "ORD-2026-0001",
      };

      const result = await gateway.initiateRefund(mockPayment, 15000);
      expect(result.success).toBe(true);
      expect(result.refundId).toBe("snap_ref_777");

      // Verify refund request
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, options] = fetchSpy.mock.calls[0]!;
      expect(url).toContain("/refund");
      const body = JSON.parse(options!.body as string);
      expect(body.merchantId).toBe("2025");
      expect(body.refund_amount).toBe("15000.00");

      fetchSpy.mockRestore();
    });

    it("should handle refund rejection from gateway", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          message: "Transaction already refunded",
        }),
      } as any);

      const mockPayment: any = {
        amount: 45000,
        gatewayOrderId: "ORD-2026-0001",
      };

      const result = await gateway.initiateRefund(mockPayment);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Transaction already refunded");

      fetchSpy.mockRestore();
    });
  });
});
