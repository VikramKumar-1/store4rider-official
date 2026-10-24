import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import { SnapmintGateway } from "../SnapmintGateway";
import { AppError } from "../../errors/AppError";

vi.mock("../../config/env", () => ({
  ENV: {
    SNAPMINT_MERCHANT_ID: "snap_merchant_123",
    SNAPMINT_SECRET: "snap_secret_token_456",
    SNAPMINT_MODE: "test",
    NEXT_PUBLIC_API_URL: "http://localhost:4000",
    API_URL: "http://localhost:4000",
    FRONTEND_URL: "http://localhost:3000",
  },
}));

describe("SnapmintGateway - Enterprise Edge Cases & Security", () => {
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
        price: 45000,
      },
    ],
  };

  describe("createOrder & Underwriting Payload", () => {
    it("should compute correct SHA-512 checksum and include mandatory underwriting KYC fields", async () => {
      const result = await gateway.createOrder(mockOrder, 45000);

      expect(result.gatewayOrderId).toBe("ORD-2026-0001");
      const resp = result.gatewayResponse;

      expect(resp.merchant_key).toBe("snap_merchant_123");
      expect(resp.order_id).toBe("ORD-2026-0001");
      expect(resp.order_value).toBe("45000.00");
      expect(resp.full_name).toBe("Vikram Kumar");
      expect(resp.email).toBe("rider@store4riders.com");
      expect(resp.phone_number).toBe("9876543210");
      expect(resp.billing_city).toBe("Bengaluru");
      expect(resp.shipping_zipcode).toBe("560001");

      // Verify SHA-512 calculation: merchant_key | order_id | order_value | full_name | email | merchant_token
      const expectedHashString = "snap_merchant_123|ORD-2026-0001|45000.00|Vikram Kumar|rider@store4riders.com|snap_secret_token_456";
      const expectedChecksum = crypto.createHash("sha512").update(expectedHashString).digest("hex");
      expect(resp.checksum_hash).toBe(expectedChecksum);

      // Verify line items
      const products = JSON.parse(resp.products);
      expect(products).toHaveLength(1);
      expect(products[0].sku).toBe("HLMT-AGV-K6");
      expect(products[0].unit_price).toBe("45000.00");
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
  });

  describe("verifyPayment - Signature Verification & Tampering Defense", () => {
    it("should reject verification if signature hash is tampered/invalid", async () => {
      const mockPayment: any = { amount: 45000 };
      const verificationData = {
        status: "success",
        order_id: "ORD-2026-0001",
        order_value: "45000.00",
        full_name: "Vikram Kumar",
        email: "rider@store4riders.com",
        checksum_hash: "invalid_spoofed_signature_12345",
        id: "snap_txn_999",
      };

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid Snapmint signature");
    });

    it("should reject verification if amount is tampered", async () => {
      const mockPayment: any = { amount: 45000 };
      const verificationData = {
        status: "success",
        order_id: "ORD-2026-0001",
        order_value: "10.00", // Tampered amount
        full_name: "Vikram Kumar",
        email: "rider@store4riders.com",
        checksum_hash: "any_hash",
        id: "snap_txn_999",
      };

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Amount mismatch detected");
    });

    it("should successfully verify when reverse SHA-512 signature and amount match exactly", async () => {
      const mockPayment: any = { amount: 45000 };
      const status = "success";
      const orderId = "ORD-2026-0001";
      const orderValue = "45000.00";
      const fullName = "Vikram Kumar";
      const email = "rider@store4riders.com";

      // Reverse SHA-512: merchant_token | status | order_id | order_value | full_name | email | merchant_key
      const rawString = `snap_secret_token_456|${status}|${orderId}|${orderValue}|${fullName}|${email}|snap_merchant_123`;
      const validHash = crypto.createHash("sha512").update(rawString).digest("hex");

      const verificationData = {
        status,
        order_id: orderId,
        order_value: orderValue,
        full_name: fullName,
        email,
        checksum_hash: validHash,
        id: "snap_txn_999",
      };

      const result = await gateway.verifyPayment(mockPayment, verificationData);
      expect(result.success).toBe(true);
      expect(result.gatewayPaymentId).toBe("snap_txn_999");
    });
  });

  describe("handleWebhook - Asynchronous Callback Processing", () => {
    it("should process valid success webhook and emit payment.captured event", async () => {
      const status = "success";
      const orderId = "ORD-2026-0001";
      const orderValue = "45000.00";
      const fullName = "Vikram Kumar";
      const email = "rider@store4riders.com";

      const rawString = `snap_secret_token_456|${status}|${orderId}|${orderValue}|${fullName}|${email}|snap_merchant_123`;
      const validHash = crypto.createHash("sha512").update(rawString).digest("hex");

      const webhookBody = {
        status,
        order_id: orderId,
        order_value: orderValue,
        full_name: fullName,
        email,
        checksum_hash: validHash,
        id: "snap_event_888",
      };

      const result = await gateway.handleWebhook({}, JSON.stringify(webhookBody));
      expect(result.event).toBe("payment.captured");
      expect(result.gatewayOrderId).toBe("ORD-2026-0001");
      expect(result.id).toBe("snap_event_888");
      expect(result.payload.amount).toBe(45000);
    });

    it("should reject webhook with 401 when signature verification fails", async () => {
      const webhookBody = {
        status: "success",
        order_id: "ORD-2026-0001",
        order_value: "45000.00",
        full_name: "Vikram Kumar",
        email: "rider@store4riders.com",
        checksum_hash: "corrupted_hash",
        id: "snap_event_888",
      };

      await expect(gateway.handleWebhook({}, JSON.stringify(webhookBody))).rejects.toThrow(
        "Invalid Snapmint signature"
      );
    });
  });

  describe("S2S Order Status Query & Refunds", () => {
    it("should gracefully handle network failure during getPaymentStatus", async () => {
      // Mock global fetch to simulate a network drop
      const fetchSpy = vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network timeout"));

      const result = await gateway.getPaymentStatus("ORD-2026-0001");
      expect(result.status).toBe("network_error");
      expect(result.error).toBe("Network timeout");

      fetchSpy.mockRestore();
    });

    it("should execute refund and return gateway refund ID", async () => {
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

      fetchSpy.mockRestore();
    });
  });
});
