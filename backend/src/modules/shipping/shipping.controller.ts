import { NextRequest } from "next/server";
import { ApiResponse } from "../../core/response/ApiResponse";
import { ShipmentService } from "./shipment.service";
import { ShippingSettingsModel } from "./models/shipping-settings.model";
import { ShippingProviderFactory } from "../../core/shipping/ShippingProviderFactory";
import { AppError } from "../../core/errors/AppError";

export class ShippingController {
  // -------------------------------------------------------------------------
  // 1. ADMIN DISPATCH ACTIONS
  // -------------------------------------------------------------------------

  /**
   * Action 1: Push Order to Shiprocket (Option B)
   * Admin fulfills and selects warehouse inside Shiprocket Dashboard.
   */
  static async pushOrderToShiprocket(req: NextRequest) {
    const body = await req.json();
    if (!body.orderId) {
      throw new AppError("orderId is required", 400);
    }
    const result = await ShipmentService.pushOrderToShiprocket(body.orderId, body.warehouseId);
    return ApiResponse.success(result.shipment, result.message, 200);
  }

  /**
   * Action 2: Direct Carrier Shipment (Failover / Alternative)
   * Dispatches directly via Delhivery or Xpressbees with chosen warehouse.
   */
  static async createDirectShipment(req: NextRequest) {
    const body = await req.json();
    if (!body.orderId || !body.provider || !body.warehouseId) {
      throw new AppError("orderId, provider, and warehouseId are required", 400);
    }
    const result = await ShipmentService.createDirectShipment({
      orderId: body.orderId,
      provider: body.provider,
      warehouseId: body.warehouseId,
      weightKg: Number(body.weightKg || body.weight || 1),
      length: body.length ? Number(body.length) : 15,
      breadth: body.breadth ? Number(body.breadth) : 15,
      height: body.height ? Number(body.height) : 10,
    });
    return ApiResponse.success(result.shipment, result.message, 201);
  }

  /**
   * Action 3: Manual AWB Entry (Emergency / Offline Franchise)
   */
  static async createManualShipment(req: NextRequest) {
    const body = await req.json();
    if (!body.orderId || !body.courierName || !body.awb) {
      throw new AppError("orderId, courierName, and awb are required", 400);
    }
    const result = await ShipmentService.createManualShipment({
      orderId: body.orderId,
      courierName: body.courierName,
      awb: body.awb,
      trackingUrl: body.trackingUrl,
    });
    return ApiResponse.success(result.shipment, result.message, 201);
  }

  // -------------------------------------------------------------------------
  // 2. QUERY SHIPMENTS
  // -------------------------------------------------------------------------

  /**
   * Customer / Order tracking view
   */
  static async getShipmentsByOrderId(req: NextRequest, orderId: string) {
    const shipments = await ShipmentService.getShipmentsByOrderId(orderId);
    return ApiResponse.success(shipments, "Shipments retrieved");
  }

  /**
   * Paginated shipments table for Admin Dashboard
   */
  static async getAdminShipments(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: any = {};
    if (provider) query.provider = provider;
    if (status) query.status = status.toUpperCase();
    if (search) {
      query.$or = [
        { awb: { $regex: search, $options: "i" } },
        { providerOrderId: { $regex: search, $options: "i" } },
      ];
    }

    const { items, total } = await ShipmentService.getPaginatedShipments(query, page, limit);
    return ApiResponse.paginated(items, total, page, limit);
  }

  /**
   * Single shipment view
   */
  static async getShipmentById(req: NextRequest, id: string) {
    const shipment = await ShipmentService.getShipmentById(id);
    return ApiResponse.success(shipment, "Shipment retrieved");
  }

  /**
   * Sync tracking with courier partner
   */
  static async syncTracking(req: NextRequest, id: string) {
    const shipment = await ShipmentService.syncTracking(id);
    return ApiResponse.success(shipment, "Tracking synchronized");
  }

  /**
   * Request pickup
   */
  static async requestPickup(req: NextRequest, id: string) {
    const result = await ShipmentService.requestPickup(id);
    return ApiResponse.success(result, "Pickup requested");
  }

  // -------------------------------------------------------------------------
  // 3. RATES & SERVICEABILITY
  // -------------------------------------------------------------------------

  static async calculateRates(req: NextRequest) {
    const body = await req.json();
    const provider = body.provider || "shiprocket";
    const providerInstance = ShippingProviderFactory.create(provider);

    const rates = await providerInstance.getRates({
      warehouseId: body.warehouseId,
      deliveryPincode: body.deliveryPincode || body.pincode,
      weightKg: Number(body.weightKg || 0.5),
      isCod: Boolean(body.isCod),
      length: body.length ? Number(body.length) : undefined,
      breadth: body.breadth ? Number(body.breadth) : undefined,
      height: body.height ? Number(body.height) : undefined,
    });

    return ApiResponse.success(rates, "Rates fetched successfully");
  }

  static async checkServiceability(req: NextRequest) {
    const body = await req.json();
    const result = await ShipmentService.checkServiceability(
      body.deliveryPincode || body.pincode,
      body.weightKg || 0.5,
      Boolean(body.isCod)
    );
    return ApiResponse.success(result, "Serviceability fetched successfully");
  }

  // -------------------------------------------------------------------------
  // 4. ADMIN SETTINGS
  // -------------------------------------------------------------------------

  static async getSettings(req: NextRequest) {
    let settings = await ShippingSettingsModel.findOne();
    if (!settings) {
      settings = await ShippingSettingsModel.create({
        providers: [
          { providerName: "shiprocket", isActive: true, priority: 1 },
          { providerName: "delhivery", isActive: true, priority: 2 },
          { providerName: "xpressbees", isActive: true, priority: 3 },
        ],
        globalShippingPause: false,
      });
    }
    return ApiResponse.success(settings, "Shipping settings fetched");
  }

  static async updateSettings(req: NextRequest) {
    const body = await req.json();
    let settings = await ShippingSettingsModel.findOne();
    if (!settings) {
      settings = new ShippingSettingsModel(body);
    } else {
      if (body.providers) settings.providers = body.providers;
      if (body.defaultStrategy) settings.defaultStrategy = body.defaultStrategy;
      if (body.globalShippingPause !== undefined) settings.globalShippingPause = body.globalShippingPause;
    }
    await settings.save();
    return ApiResponse.success(settings, "Shipping settings updated successfully");
  }

  // -------------------------------------------------------------------------
  // 5. WEBHOOK ENTRY POINT
  // -------------------------------------------------------------------------

  static async handleWebhook(req: NextRequest, provider: string) {
    let payload;
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    const headers = Object.fromEntries(req.headers);
    await ShipmentService.handleWebhook(provider, payload, headers);
    return ApiResponse.success({}, "Webhook processed successfully");
  }
}
