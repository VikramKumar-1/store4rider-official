import { shippingGet, shippingPost } from "./shippingApiClient";
import { 
  ShippingProvider, 
  CreateShipmentInput, 
  CreateShipmentResult, 
  ShippingRate, 
  TrackingInfoResult,
  GetRatesInput,
  PickupResult
} from "./ShippingProvider";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";
import { ENV } from "../config/env";
import { WarehouseRepository } from "../../modules/warehouse/warehouse.repository";

export class XpressbeesProvider implements ShippingProvider {
  
  private baseUrl = "https://ship.xpressbees.com/api"; // Sample base URL

  private getHeaders() {
    const token = ENV.XPRESSBEES_API_KEY;
    if (!token) {
      throw new AppError("Xpressbees API credentials not configured", 500);
    }
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const headers = this.getHeaders();
    const warehouse = await WarehouseRepository.findDefault();
    if (!warehouse || !warehouse.pincode) {
      throw new AppError("Default warehouse pincode not configured", 500);
    }
    const originPincode = warehouse.pincode;
    
    const payload = {
      order_number: input.orderNumber,
      payment_type: input.paymentMethod === "cod" ? "COD" : "Prepaid",
      consignee: {
        name: input.shippingAddress.fullName,
        address: input.shippingAddress.addressLine1,
        city: input.shippingAddress.city,
        state: input.shippingAddress.state,
        pincode: input.shippingAddress.pincode,
        phone: input.shippingAddress.phone,
      },
      pickup: {
        pincode: originPincode,
      },
      shipment: {
        length: input.length,
        breadth: input.breadth,
        height: input.height,
        weight: input.weight * 1000,
        amount: input.totalAmount,
      }
    };

    try {
      const response = await shippingPost(`${this.baseUrl}/shipments`, payload, { headers });
      const data = response.data.data;
      
      if (!response.data.status) {
        throw new AppError(response.data.message || "Failed to create Xpressbees shipment", 400);
      }

      return {
        success: true,
        shipmentId: data.shipment_id,
        awb: data.awb_number,
        courierName: "Xpressbees Express",
        message: "Shipment created successfully in Xpressbees"
      };
    } catch (error: any) {
      logger.error(`Xpressbees Create Shipment Error: ${JSON.stringify(error.response?.data || error.message)}`);
      throw new AppError("Failed to create Xpressbees shipment", 400);
    }
  }

  async requestPickup(shipmentId: string, providerOrderId?: string): Promise<PickupResult> {
    const headers = this.getHeaders();
    try {
      // Dummy endpoint based on standard patterns; Xpressbees typically has a /pickup endpoint
      const response = await shippingPost(`${this.baseUrl}/pickup`, {
        order_id: shipmentId
      }, { headers });
      
      return {
        success: true,
        message: response.data?.message || "Pickup requested successfully"
      };
    } catch (error: any) {
      logger.error(`Xpressbees Pickup Request Error: ${error.response?.data?.message || error.message}`);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to request pickup"
      };
    }
  }

  async generateLabel(shipmentId: string): Promise<string | null> {
    const headers = this.getHeaders();
    try {
      const response = await shippingGet(`${this.baseUrl}/shipments/label/${shipmentId}`, { headers });
      return response.data.data?.label_url || null;
    } catch (error) {
      logger.error("Xpressbees Label Generation Error", error);
      return null;
    }
  }

  async getTrackingInfo(awb: string): Promise<TrackingInfoResult> {
    const headers = this.getHeaders();
    try {
      const response = await shippingGet(`${this.baseUrl}/track/${awb}`, { headers });
      
      const trackData = response.data.data;
      if (!trackData || trackData.length === 0) {
        return { success: false, currentStatus: "UNKNOWN", events: [] };
      }

      return {
        success: true,
        currentStatus: trackData[0]?.status || "UNKNOWN",
        events: trackData.map((activity: any) => ({
          status: activity.status,
          providerStatus: activity.status,
          location: activity.location,
          timestamp: activity.timestamp,
          activity: activity.remark,
          description: activity.remark,
        })),
        estimatedDelivery: trackData[0]?.expected_delivery
      };
    } catch (error: any) {
      logger.error(`Xpressbees Tracking Error: ${error.response?.data?.message || error.message}`);
      return { success: false, currentStatus: "ERROR", events: [] };
    }
  }

  async getRates(input: GetRatesInput): Promise<ShippingRate[]> {
    const headers = this.getHeaders();
    try {
      const warehouse = await WarehouseRepository.findDefault();
      if (!warehouse || !warehouse.pincode) {
        throw new AppError("Default warehouse pincode not configured", 500);
      }
      const originPincode = warehouse.pincode;
      
      const response = await shippingGet(`${this.baseUrl}/serviceability`, {
        params: {
          destination_pincode: input.deliveryPincode,
          source_pincode: originPincode,
          weight: input.weightKg * 1000,
          payment_type: input.isCod ? "COD" : "Prepaid",
          length: input.length,
          breadth: input.breadth,
          height: input.height
        },
        headers,
      });

      const data = response.data.data;
      if (!data?.serviceable) return [];
      
      if (!data.estimated_charges) {
        return []; // Strictly rely on API, no hardcoded fallbacks
      }

      return [
        {
          courierName: "Xpressbees Express",
          courierId: "xpressbees_express",
          rate: data.estimated_charges,
          estimatedDeliveryDays: data.estimated_delivery_days ? String(data.estimated_delivery_days) : "",
          isCodAvailable: Boolean(data.cod_available)
        }
      ];
    } catch (error: any) {
      logger.error(`Xpressbees Rates Error: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async cancelShipment(shipmentId: string, awb: string): Promise<boolean> {
    const headers = this.getHeaders();
    try {
      await shippingPost(`${this.baseUrl}/shipments/cancel`, { awb_number: awb }, { headers });
      return true;
    } catch (error: any) {
      logger.error(`Xpressbees Cancel Error: ${error.response?.data?.message || error.message}`);
      throw new AppError("Failed to cancel Xpressbees shipment", 500);
    }
  }

  async checkServiceability(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<import("./ShippingProvider").ServiceabilityResult> {
    const rates = await this.getRates({ deliveryPincode, weightKg, isCod });
    if (rates.length === 0) {
      return { serviceable: false, codAvailable: false, provider: "xpressbees" };
    }
    
    return {
      serviceable: true,
      codAvailable: rates[0].isCodAvailable,
      estimatedDays: parseInt(rates[0].estimatedDeliveryDays, 10) || undefined,
      provider: "xpressbees"
    };
  }

  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean {
    if (!ENV.XPRESSBEES_WEBHOOK_TOKEN) {
      logger.warn("XPRESSBEES_WEBHOOK_TOKEN not configured. Bypassing Xpressbees webhook verification (NOT SECURE).");
      return true;
    }

    // Xpressbees can use a custom header or Bearer token for their webhooks
    const token = headers["authorization"]?.replace("Bearer ", "") || headers["x-xpressbees-token"] || headers["x-api-key"];
    
    if (!token || token !== ENV.XPRESSBEES_WEBHOOK_TOKEN) {
      logger.warn("Xpressbees webhook unauthorized (invalid or missing token)");
      return false;
    }

    return true;
  }
}
