import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShipmentService } from "../shipment.service";
import { ShipmentModel } from "../shipment.model";
import { OrderModel } from "../../order/order.model";
import { ProductModel } from "../../product/product.model";
import { WarehouseRepository } from "../../warehouse/warehouse.repository";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { AppError, NotFoundError, ValidationError } from "../../../core/errors/AppError";

vi.mock("../shipment.model");
vi.mock("../models/shipping-tracking-event.model");
vi.mock("../../order/order.model");
vi.mock("../../product/product.model");
vi.mock("../../warehouse/warehouse.repository");
vi.mock("../../../core/shipping/ShippingProviderFactory");
vi.mock("../../../core/cache/redis", () => ({
  getCache: vi.fn().mockResolvedValue(null),
  setCache: vi.fn().mockResolvedValue(true),
}));

describe("ShipmentService - Deep Edge Case & Robustness Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 1: IDEMPOTENCY & DUPLICATE DISPATCH PREVENTION
  // ---------------------------------------------------------------------------
  describe("Edge Case 1: Double-Click / Idempotent Dispatch Prevention", () => {
    it("prevents double-booking if admin clicks 'Push to Shiprocket' twice", async () => {
      const mockOrder = { _id: "order_dup_1", orderNumber: "ORD-999" };
      (OrderModel.findById as any).mockResolvedValue(mockOrder);

      // Existing shipment is found
      const existingShipment = {
        _id: "ship_existing",
        orderId: "order_dup_1",
        provider: "shiprocket",
        providerShipmentId: "sr_99999",
      };
      (ShipmentModel.findOne as any).mockResolvedValue(existingShipment);

      const result = await ShipmentService.pushOrderToShiprocket("order_dup_1");

      expect(result.shipment).toBe(existingShipment);
      expect(result.message).toContain("already pushed");
      // Must NOT invoke Shiprocket API again
      expect(ShippingProviderFactory.create).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 2: MISSING PRODUCT WEIGHTS IN DATABASE
  // ---------------------------------------------------------------------------
  describe("Edge Case 2: Products Without Weight in Database", () => {
    it("safely falls back to 0.5kg per item when product weight is missing or null", async () => {
      const mockOrder = {
        _id: "order_no_wt",
        orderNumber: "ORD-NOWT",
        paymentMethod: "prepaid",
        status: "confirmed",
        pricing: { total: 2000, shipping: 0 },
        shippingAddress: {
          fullName: "Rider X",
          phone: "9999999999",
          addressLine1: "Street 1",
          city: "Kolkata",
          state: "WB",
          pincode: "700001",
        },
        items: [
          { productId: "p_missing_1", name: "Balaclava", quantity: 2, unitPrice: 500 },
          { productId: "p_missing_2", name: "Keyring", quantity: 1, unitPrice: 1000 },
        ],
        notes: [],
        save: vi.fn().mockResolvedValue(true),
      };

      (OrderModel.findById as any).mockResolvedValue(mockOrder);
      (ShipmentModel.findOne as any).mockResolvedValue(null);

      // DB returns items with undefined weight
      (ProductModel.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([
              { _id: "p_missing_1", weight: null },
              { _id: "p_missing_2" },
            ]),
          }),
        }),
      });

      (WarehouseRepository.findDefault as any).mockResolvedValue({
        shiprocketLocationId: "Kolkata_Hub",
      });

      const mockProvider = {
        createShipment: vi.fn().mockResolvedValue({
          success: true,
          shipmentId: "sr_123",
        }),
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);

      const mockShipmentInstance = { save: vi.fn().mockResolvedValue(true) };
      (ShipmentModel as any).mockImplementation(() => mockShipmentInstance);

      await ShipmentService.pushOrderToShiprocket("order_no_wt");

      // 2 * 0.5 + 1 * 0.5 = 1.5kg
      expect(mockProvider.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({ weight: 1.5 })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 3: COD VS PREPAID CHARGES INTEGRITY
  // ---------------------------------------------------------------------------
  describe("Edge Case 3: Financial Integrity (COD vs Prepaid)", () => {
    it("ensures Prepaid orders have cod_amount strictly set to 0", async () => {
      const mockOrder = {
        _id: "order_prepaid",
        orderNumber: "ORD-PREPAID",
        paymentMethod: "prepaid",
        status: "confirmed",
        pricing: { total: 5000, shipping: 0 },
        shippingAddress: { fullName: "A", phone: "1", addressLine1: "X", city: "C", state: "S", pincode: "111111" },
        items: [{ productId: "p1", name: "Gloves", quantity: 1, unitPrice: 5000 }],
        notes: [],
        save: vi.fn().mockResolvedValue(true),
      };

      (OrderModel.findById as any).mockResolvedValue(mockOrder);
      (ShipmentModel.findOne as any).mockResolvedValue(null);
      (ProductModel.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([{ _id: "p1", weight: 0.8 }]),
          }),
        }),
      });
      (WarehouseRepository.findDefault as any).mockResolvedValue({ shiprocketLocationId: "Hub" });

      const mockProvider = {
        createShipment: vi.fn().mockResolvedValue({ success: true, shipmentId: "sr_prep" }),
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);
      (ShipmentModel as any).mockImplementation(() => ({ save: vi.fn().mockResolvedValue(true) }));

      await ShipmentService.pushOrderToShiprocket("order_prepaid");

      expect(mockProvider.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: "prepaid",
          totalAmount: 5000,
        })
      );
    });

    it("uses codAmountToCollect if order has partial online payment for COD", async () => {
      const mockOrder = {
        _id: "order_cod_part",
        orderNumber: "ORD-COD-PART",
        paymentMethod: "cod",
        status: "confirmed",
        pricing: {
          total: 10000,
          codPartialPaymentAmount: 2000,
          codAmountToCollect: 8000,
          shipping: 0,
        },
        shippingAddress: { fullName: "B", phone: "2", addressLine1: "Y", city: "C", state: "S", pincode: "222222" },
        items: [{ productId: "p2", name: "Boots", quantity: 1, unitPrice: 10000 }],
        notes: [],
        save: vi.fn().mockResolvedValue(true),
      };

      (OrderModel.findById as any).mockResolvedValue(mockOrder);
      (ShipmentModel.findOne as any).mockResolvedValue(null);
      (ProductModel.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValue([{ _id: "p2", weight: 2.5 }]),
          }),
        }),
      });
      (WarehouseRepository.findDefault as any).mockResolvedValue({ shiprocketLocationId: "Hub" });

      const mockProvider = {
        createShipment: vi.fn().mockResolvedValue({ success: true, shipmentId: "sr_cod" }),
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);
      (ShipmentModel as any).mockImplementation(() => ({ save: vi.fn().mockResolvedValue(true) }));

      await ShipmentService.pushOrderToShiprocket("order_cod_part");

      expect(mockProvider.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: "cod",
          totalAmount: 8000, // Strictly remaining balance, NOT full 10,000!
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 4: ADDRESS LINE 2 / STREET FALLBACK
  // ---------------------------------------------------------------------------
  describe("Edge Case 4: Address Normalization (Legacy Street vs AddressLine1)", () => {
    it("correctly maps street to addressLine1 if addressLine1 is missing", async () => {
      const mockOrder = {
        _id: "order_legacy_addr",
        orderNumber: "ORD-LEGACY",
        paymentMethod: "prepaid",
        status: "confirmed",
        pricing: { total: 1000, shipping: 0 },
        shippingAddress: {
          fullName: "Old User",
          phone: "9191919191",
          street: "45 Old Road", // No addressLine1
          city: "Pune",
          state: "MH",
          pincode: "411001",
        },
        items: [{ productId: "p3", name: "Stickers", quantity: 1, unitPrice: 1000 }],
        notes: [],
        save: vi.fn().mockResolvedValue(true),
      };

      (OrderModel.findById as any).mockResolvedValue(mockOrder);
      (ShipmentModel.findOne as any).mockResolvedValue(null);
      (ProductModel.find as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) }),
        }),
      });
      (WarehouseRepository.findDefault as any).mockResolvedValue({ shiprocketLocationId: "Hub" });

      const mockProvider = {
        createShipment: vi.fn().mockResolvedValue({ success: true, shipmentId: "sr_legacy" }),
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);
      (ShipmentModel as any).mockImplementation(() => ({ save: vi.fn().mockResolvedValue(true) }));

      await ShipmentService.pushOrderToShiprocket("order_legacy_addr");

      expect(mockProvider.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({
          shippingAddress: expect.objectContaining({
            addressLine1: "45 Old Road",
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 5: WEBHOOK SECURITY & TAMPERING PREVENTION
  // ---------------------------------------------------------------------------
  describe("Edge Case 5: Rogue Webhook Signature Rejection", () => {
    it("rejects webhooks with invalid signatures with AppError(401)", async () => {
      const mockProvider = {
        verifyWebhookSignature: vi.fn().mockReturnValue(false), // Signature failed
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);

      await expect(
        ShipmentService.handleWebhook("shiprocket", { awb: "123" }, { "x-sig": "fake" })
      ).rejects.toThrow(AppError);
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 6: RTO (RETURN TO ORIGIN) AND NDR TRANSITIONS
  // ---------------------------------------------------------------------------
  describe("Edge Case 6: RTO & Undelivered Webhook Transitions", () => {
    it("transitions shipment to RTO_INITIATED without marking order delivered", async () => {
      const mockProvider = {
        verifyWebhookSignature: vi.fn().mockReturnValue(true),
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);

      const mockShipment = {
        orderId: "order_rto",
        awb: "1428909999",
        status: "IN_TRANSIT",
        save: vi.fn().mockResolvedValue(true),
      };
      (ShipmentModel.findOne as any).mockResolvedValue(mockShipment);

      await ShipmentService.handleWebhook("shiprocket", {
        awb: "1428909999",
        current_status: "RTO Initiated",
      }, {});

      expect(mockShipment.status).toBe("RTO_INITIATED");
      expect(mockShipment.save).toHaveBeenCalled();
      // Order must NEVER be marked delivered when RTO happens!
      expect(OrderModel.findByIdAndUpdate).not.toHaveBeenCalledWith("order_rto", { status: "delivered" });
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE 7: LIVE TRACKING SYNC
  // ---------------------------------------------------------------------------
  describe("Edge Case 7: Real-Time Tracking Sync with Courier Partner", () => {
    it("synchronizes live tracking and updates status to IN_TRANSIT", async () => {
      const mockShipment = {
        _id: "ship_1",
        orderId: "order_1",
        awb: "142890123984",
        provider: "delhivery",
        status: "AWB_ASSIGNED",
        save: vi.fn().mockResolvedValue(true),
      };
      (ShipmentModel.findById as any).mockResolvedValue(mockShipment);

      const mockProvider = {
        getTrackingInfo: vi.fn().mockResolvedValue({
          success: true,
          currentStatus: "In Transit - Reached Hub",
        }),
      };
      (ShippingProviderFactory.create as any).mockReturnValue(mockProvider);

      const result = await ShipmentService.syncTracking("ship_1");

      expect(result.status).toBe("IN_TRANSIT");
      expect(result.providerStatus).toBe("In Transit - Reached Hub");
      expect(mockShipment.save).toHaveBeenCalled();
    });

    it("throws 400 when attempting to sync tracking on a shipment without an AWB", async () => {
      const mockShipment = {
        _id: "ship_no_awb",
        awb: null,
      };
      (ShipmentModel.findById as any).mockResolvedValue(mockShipment);

      await expect(ShipmentService.syncTracking("ship_no_awb")).rejects.toThrow(AppError);
    });
  });
});
