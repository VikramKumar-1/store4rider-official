import { describe, it, expect, vi, beforeEach } from "vitest";
import { CCavenueGateway } from "../CCavenueGateway";
import { ENV } from "../../config/env";
import crypto from "crypto";

describe("CCavenueGateway", () => {
  const gateway = new CCavenueGateway();
  const testWorkingKey = "12345678901234567890123456789012"; // 32 chars

  function encryptResponse(data: string, workingKey: string): string {
    const m = crypto.createHash("md5");
    m.update(workingKey);
    const key = m.digest();
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    const cipher = crypto.createCipheriv("aes-128-cbc", key, iv);
    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  beforeEach(() => {
    process.env.CCAVENUE_MERCHANT_ID = "88305";
    process.env.CCAVENUE_ACCESS_CODE = "AVDL81FJ12BN26LDNB";
    process.env.CCAVENUE_WORKING_KEY = testWorkingKey;
    process.env.CCAVENUE_MODE = "live";
    (ENV as any).CCAVENUE_MODE = "live";
    (ENV as any).CCAVENUE_WORKING_KEY = testWorkingKey;
    process.env.API_URL = "http://localhost:4000";
    process.env.FRONTEND_URL = "http://localhost:3000";
  });

  it("should generate encrypted payload and correct live actionUrl", async () => {
    const mockOrder: any = {
      orderNumber: "OD-S4R-2610100088",
      shippingAddress: {
        fullName: "Vikram Kumar",
        street: "Sector 14",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122001",
        country: "India",
        phone: "9876543210",
      },
      userEmail: "test@example.com",
    };

    const result = await gateway.createOrder(mockOrder, 1500);

    expect(result.gatewayOrderId).toBe("OD-S4R-2610100088");
    expect(result.gatewayResponse.access_code).toBe("AVDL81FJ12BN26LDNB");
    expect(result.gatewayResponse.actionUrl).toBe(
      "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    );

    // Decrypt the encRequest to verify its inner query string structure
    const encRequest = result.gatewayResponse.encRequest;
    const m = crypto.createHash("md5");
    m.update(testWorkingKey);
    const key = m.digest();
    const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
    const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
    let decrypted = decipher.update(encRequest, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Verify key parameters are present and uncorrupted
    expect(decrypted).toContain("tid=");
    expect(decrypted).toContain("merchant_id=88305");
    expect(decrypted).toContain("order_id=OD-S4R-2610100088");
    expect(decrypted).toContain("amount=1500.00");
    expect(decrypted).toContain("currency=INR");
    expect(decrypted).toContain("redirect_url=https://store4riders.com/api/v1/orders/webhook/ccavenue");
    expect(decrypted).toContain("cancel_url=https://store4riders.com/checkout");
    expect(decrypted).toContain("billing_name=Vikram Kumar");
    expect(decrypted).not.toContain("https%3A%2F%2F");
  });

  it("should point to test endpoint when mode is test", async () => {
    process.env.CCAVENUE_MODE = "test";
    (ENV as any).CCAVENUE_MODE = "test";

    const mockOrder: any = {
      orderNumber: "OD-TEST-001",
      shippingAddress: { fullName: "Tester", phone: "9999999999" },
    };

    const result = await gateway.createOrder(mockOrder, 500);
    expect(result.gatewayResponse.actionUrl).toBe(
      "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    );
  });

  it("should verify valid decrypted payment response", async () => {
    const rawData = "order_id=OD-S4R-2610100088&tracking_id=312009876543&order_status=Success&amount=1500.00&currency=INR";
    const encResp = encryptResponse(rawData, testWorkingKey);

    const mockPayment: any = { amount: 1500 };
    const result = await gateway.verifyPayment(mockPayment, { encResp });

    expect(result.success).toBe(true);
    expect(result.gatewayPaymentId).toBe("312009876543");
  });

  it("should reject verification if amount is tampered (less than expected)", async () => {
    const rawData = "order_id=OD-S4R-2610100088&tracking_id=312009876543&order_status=Success&amount=10.00&currency=INR";
    const encResp = encryptResponse(rawData, testWorkingKey);

    const mockPayment: any = { amount: 1500 };
    const result = await gateway.verifyPayment(mockPayment, { encResp });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Amount mismatch detected");
  });

  it("should reject verification if currency is tampered (non-INR)", async () => {
    const rawData = "order_id=OD-S4R-2610100088&tracking_id=312009876543&order_status=Success&amount=1500.00&currency=USD";
    const encResp = encryptResponse(rawData, testWorkingKey);

    const mockPayment: any = { amount: 1500 };
    const result = await gateway.verifyPayment(mockPayment, { encResp });

    expect(result.success).toBe(false);
    expect(result.message).toBe("Currency mismatch detected");
  });

  it("should decrypt and parse S2S webhook payload", async () => {
    const rawData = "order_id=OD-S4R-2610100088&tracking_id=312009876543&order_status=Success&amount=1500.00&bank_ref_no=HDFC123456";
    const encResp = encryptResponse(rawData, testWorkingKey);

    const body = `encResp=${encResp}`;
    const result = await gateway.handleWebhook({}, body);

    expect(result.event).toBe("payment.captured");
    expect(result.gatewayOrderId).toBe("OD-S4R-2610100088");
    expect(result.payload.id).toBe("312009876543");
    expect(result.payload.amount).toBe(1500);
    expect(result.payload.bankRefNo).toBe("HDFC123456");
  });
});
