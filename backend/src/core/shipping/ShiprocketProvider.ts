import axios from "axios";
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
import { ENV } from "../config/env";
import { logger } from "../utils/logger";
import { getCache, setCache } from "../cache/redis";
import { WarehouseRepository } from "../../modules/warehouse/warehouse.repository";

export class ShiprocketProvider implements ShippingProvider {
  private baseUrl = "https://apiv2.shiprocket.in/v1/external";

  private async getAuthToken(): Promise<string> {
    const cachedToken = await getCache("shiprocket:auth_token");
    if (cachedToken) {
      return cachedToken as string;
    }

    const email = ENV.SHIPROCKET_EMAIL;
    const password = ENV.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new AppError("Shiprocket credentials are not configured", 500);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email,
        password
      }, { timeout: 15000 });
      
      const token = response.data.token;
      // Shiprocket tokens are valid for 10 days. We'll cache for 9 days (9 * 24 * 60 * 60 = 777600 seconds)
      await setCache("shiprocket:auth_token", token, 777600);
      return token;
    } catch (error: any) {
      logger.error(`Shiprocket Auth Error: ${error.response?.data?.message || error.message}`);
      throw new AppError("Failed to authenticate with Shiprocket", 500);
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const token = await this.getAuthToken();
    const warehouse = await WarehouseRepository.findDefault();
    if (!warehouse || !warehouse.shiprocketLocationId) {
      throw new AppError("Default warehouse with Shiprocket Location ID not configured", 500);
    }
    const pickupLocation = warehouse.shiprocketLocationId;
    
    try {
      const payload = {
        order_id: input.orderNumber,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: pickupLocation, // Shiprocket expects the nickname or pincode registered in their system
        billing_customer_name: input.shippingAddress.fullName,
        billing_last_name: "",
        billing_address: input.shippingAddress.addressLine1,
        billing_address_2: input.shippingAddress.addressLine2 || "",
        billing_city: input.shippingAddress.city,
        billing_pincode: input.shippingAddress.pincode,
        billing_state: input.shippingAddress.state,
        billing_country: input.shippingAddress.country,
        billing_email: input.email,
        billing_phone: input.shippingAddress.phone,
        shipping_is_billing: true,
        order_items: input.items.map(item => ({
          name: item.name,
          sku: item.sku,
          units: item.quantity,
          selling_price: item.unitPrice,
        })),
        payment_method: input.paymentMethod === "cod" ? "COD" : "Prepaid",
        cod_amount: input.paymentMethod === "cod" ? input.totalAmount : 0,
        sub_total: input.totalAmount,
        length: input.length,
        breadth: input.breadth,
        height: input.height,
        weight: input.weight
      };

      const response = await shippingPost(`${this.baseUrl}/orders/create/adhoc`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        success: true,
        shipmentId: String(response.data.shipment_id),
        awb: response.data.awb_code,
        courierName: response.data.courier_name,
        message: "Shipment created successfully in Shiprocket"
      };
    } catch (error: any) {
      logger.error(`Shiprocket Create Shipment Error: ${JSON.stringify(error.response?.data || error.message)}`);
      throw new AppError("Failed to create Shiprocket shipment", 400);
    }
  }

  async requestPickup(shipmentId: string, providerOrderId?: string): Promise<PickupResult> {
    const token = await this.getAuthToken();
    try {
      const response = await shippingPost(`${this.baseUrl}/courier/generate/pickup`, {
        shipment_id: [shipmentId]
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        success: true,
        message: response.data?.message || "Pickup requested successfully"
      };
    } catch (error: any) {
      logger.error(`Shiprocket Pickup Request Error: ${error.response?.data?.message || error.message}`);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to request pickup"
      };
    }
  }

  async generateLabel(shipmentId: string): Promise<string | null> {
    const token = await this.getAuthToken();
    try {
      const response = await shippingPost(`${this.baseUrl}/courier/generate/label`, {
        shipment_id: [shipmentId]
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.label_url;
    } catch (error: any) {
      logger.error(`Shiprocket Generate Label Error: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  async getTrackingInfo(awb: string): Promise<TrackingInfoResult> {
    const token = await this.getAuthToken();
    try {
      const response = await shippingGet(`${this.baseUrl}/courier/track/awb/${awb}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const trackData = response.data.tracking_data;
      if (!trackData || trackData.track_status === 0) {
        return { success: false, currentStatus: "UNKNOWN", events: [] };
      }

      return {
        success: true,
        currentStatus: trackData.shipment_track_activities[0]?.sr_status_label || trackData.shipment_status,
        events: trackData.shipment_track_activities.map((activity: any) => ({
          status: activity.sr_status_label,
          providerStatus: activity.sr_status_label,
          location: activity.location,
          timestamp: activity.date,
          activity: activity.activity,
          description: activity.activity,
        })),
        estimatedDelivery: trackData.etd
      };
    } catch (error: any) {
      logger.error(`Shiprocket Tracking Error: ${error.response?.data?.message || error.message}`);
      return { success: false, currentStatus: "ERROR", events: [] };
    }
  }

  async getRates(input: GetRatesInput): Promise<ShippingRate[]> {
    const token = await this.getAuthToken();
    try {
      const warehouse = await WarehouseRepository.findDefault();
      if (!warehouse || !warehouse.pincode) {
        throw new AppError("Default warehouse pincode not configured", 500);
      }
      const originPincode = warehouse.pincode;
      
      const response = await shippingGet(`${this.baseUrl}/courier/serviceability/`, {
        params: {
          pickup_postcode: originPincode,
          delivery_postcode: input.deliveryPincode,
          weight: input.weightKg,
          cod: input.isCod ? 1 : 0,
          length: input.length,
          breadth: input.breadth,
          height: input.height
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const couriers = response.data.data.available_courier_companies || [];
      return couriers.map((c: any) => ({
        courierName: c.courier_name,
        courierId: String(c.courier_company_id),
        rate: c.rate,
        estimatedDeliveryDays: c.estimated_delivery_days,
        isCodAvailable: c.cod === 1
      }));
    } catch (error: any) {
      logger.error(`Shiprocket Rates Error: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async cancelShipment(shipmentId: string, awb: string): Promise<boolean> {
    const token = await this.getAuthToken();
    try {
      await shippingPost(`${this.baseUrl}/orders/cancel/awb`, {
        awbs: [awb]
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return true;
    } catch (error: any) {
      logger.error(`Shiprocket Cancel Error: ${error.response?.data?.message || error.message}`);
      throw new AppError("Failed to cancel Shiprocket shipment", 500);
    }
  }

  async checkServiceability(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<import("./ShippingProvider").ServiceabilityResult> {
    const rates = await this.getRates({ deliveryPincode, weightKg, isCod });
    if (rates.length === 0) {
      return { serviceable: false, codAvailable: false, provider: "shiprocket" };
    }
    const fastest = [...rates].sort((a, b) => (parseInt(a.estimatedDeliveryDays, 10) || 999) - (parseInt(b.estimatedDeliveryDays, 10) || 999))[0];
    return {
      serviceable: true,
      codAvailable: rates.some(r => r.isCodAvailable),
      estimatedDays: parseInt(fastest.estimatedDeliveryDays, 10) || undefined,
      provider: "shiprocket"
    };
  }

  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean {
    if (!ENV.SHIPROCKET_WEBHOOK_SECRET) {
      logger.warn("SHIPROCKET_WEBHOOK_SECRET not configured. Bypassing webhook verification (NOT SECURE).");
      return true; // Bypass only if explicitly unconfigured
    }

    // Shiprocket sends HMAC SHA-256 signature in 'x-api-hmac-sha256' header
    // Some older docs say 'x-api-key' or 'x-shiprocket-signature', we check common ones
    const signature = headers["x-api-hmac-sha256"] || headers["x-shiprocket-signature"] || headers["x-api-key"];
    
    if (!signature) {
      logger.warn("Shiprocket webhook signature missing in headers");
      return false;
    }

    try {
      const crypto = require("crypto");
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      const expectedSignature = crypto
        .createHmac("sha256", ENV.SHIPROCKET_WEBHOOK_SECRET)
        .update(payloadString)
        .digest("hex");

      if (signature === expectedSignature) {
        return true;
      }
      
      logger.warn(`Shiprocket webhook signature mismatch. Expected: ${expectedSignature}, Received: ${signature}`);
      return false;
    } catch (err) {
      logger.error(`Error verifying Shiprocket signature: ${err}`);
      return false;
    }
  }
}
