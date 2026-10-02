import { NextRequest } from "next/server";
import { ApiResponse } from "../../core/response/ApiResponse";
import { RateService } from "./services/rate.service";
import { ShipmentService } from "./services/shipment.service";
import { CancellationService } from "./services/cancellation.service";
import { ReturnShippingService } from "./services/return-shipping.service";
import { WebhookService } from "./services/webhook.service";
import { ShippingSettingsModel } from "./models/shipping-settings.model";

export class ShippingController {
  
  // -------------------------------------------------------------------------
  // RATE QUOTES
  // -------------------------------------------------------------------------
  static async calculateRates(req: NextRequest) {
    const body = await req.json();
    const rates = await RateService.calculateRates(body, false, body.forcedProvider);
    return ApiResponse.success(rates, "Rates fetched successfully");
  }

  static async checkServiceability(req: NextRequest) {
    const body = await req.json();
    const result = await ShipmentService.checkServiceability(
      body.deliveryPincode,
      body.weightKg || 0.5,
      body.isCod || false
    );
    return ApiResponse.success(result, "Serviceability fetched successfully");
  }

  // -------------------------------------------------------------------------
  // SHIPMENT CREATION & OVERRIDE
  // -------------------------------------------------------------------------
  static async createShipment(req: NextRequest) {
    const body = await req.json();
    // Assuming body contains full order data or we fetch order internally.
    // For manual override, frontend passes `forcedProvider: "xpressbees"`
    const shipment = await ShipmentService.createPendingShipment(body.order, body.forcedProvider);
    return ApiResponse.success(shipment, "Shipment creation queued successfully", 201);
  }

  // -------------------------------------------------------------------------
  // CANCELLATION
  // -------------------------------------------------------------------------
  static async cancelShipment(req: NextRequest, id: string) {
    const body = await req.json();
    const result = await CancellationService.cancelShipment(id, body.reason || "Cancelled by Admin");
    return ApiResponse.success(result, "Cancellation processed");
  }

  // -------------------------------------------------------------------------
  // RETURNS / RTO
  // -------------------------------------------------------------------------
  static async createReturnShipment(req: NextRequest) {
    const body = await req.json();
    const result = await ReturnShippingService.createReverseShipment(
      body.orderId, body.pickupPincode, body.warehousePincode, body.weightKg, body.dimensions
    );
    return ApiResponse.success(result, "Return shipment created");
  }

  static async markRtoDelivered(req: NextRequest) {
    const body = await req.json();
    await ReturnShippingService.markRtoDeliveredAtWarehouse(body.awb);
    return ApiResponse.success({}, "RTO marked as delivered at warehouse");
  }

  // -------------------------------------------------------------------------
  // ADMIN SETTINGS (TOGGLES)
  // -------------------------------------------------------------------------
  static async updateSettings(req: NextRequest) {
    const body = await req.json();
    let settings = await ShippingSettingsModel.findOne();
    if (!settings) {
      settings = new ShippingSettingsModel(body);
    } else {
      settings.providers = body.providers || settings.providers;
      settings.defaultStrategy = body.defaultStrategy || settings.defaultStrategy;
      settings.globalShippingPause = body.globalShippingPause !== undefined ? body.globalShippingPause : settings.globalShippingPause;
    }
    
    // Audit who changed it
    settings.updatedBy = req.headers.get("x-user-id") || "admin";
    await settings.save();
    
    return ApiResponse.success(settings, "Shipping settings updated successfully");
  }

  static async getSettings(req: NextRequest) {
    const settings = await ShippingSettingsModel.findOne();
    return ApiResponse.success(settings, "Shipping settings fetched");
  }

  // -------------------------------------------------------------------------
  // WEBHOOK ENTRY
  // -------------------------------------------------------------------------
  static async handleWebhook(req: NextRequest, provider: string) {
    const payload = await req.json();
    const headers = Object.fromEntries(req.headers);
    
    await WebhookService.processWebhook(provider, payload, headers);
    
    return ApiResponse.success({}, "Webhook processed successfully"); // 200 OK
  }
}
