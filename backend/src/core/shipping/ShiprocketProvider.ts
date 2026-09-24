import axios from "axios";
import { 
  ShippingProvider, 
  CreateShipmentInput, 
  CreateShipmentResult, 
  ShippingRate, 
  TrackingInfoResult 
} from "./ShippingProvider";
import { AppError } from "../errors/AppError";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";

export class ShiprocketProvider implements ShippingProvider {
  private baseUrl = "https://apiv2.shiprocket.in/v1/external";

  private async getAuthToken(): Promise<string> {
    const email = ENV.SHIPROCKET_EMAIL;
    const password = ENV.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new AppError("Shiprocket credentials are not configured", 500);
    }

    try {
      const response = await axios.post(`${this.baseUrl}/auth/login`, {
        email,
        password
      });
      return response.data.token;
    } catch (error: any) {
      logger.error(`Shiprocket Auth Error: ${error.response?.data?.message || error.message}`);
      throw new AppError("Failed to authenticate with Shiprocket", 500);
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const token = await this.getAuthToken();
    const settings = await require("../../modules/settings/setting.repository").SettingRepository.getSettings();
    const originPincode = settings?.storeOriginPincode || "411001";
    
    try {
      const payload = {
        order_id: input.orderNumber,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: originPincode, // Shiprocket expects the nickname or pincode registered in their system
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
        sub_total: input.totalAmount,
        length: input.length,
        breadth: input.breadth,
        height: input.height,
        weight: input.weight
      };

      const response = await axios.post(`${this.baseUrl}/orders/create/adhoce`, payload, {
        headers: { Authorization: `Bearer ${token}` }
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

  async generateLabel(shipmentId: string): Promise<string> {
    const token = await this.getAuthToken();
    try {
      const response = await axios.post(`${this.baseUrl}/courier/generate/label`, {
        shipment_id: [shipmentId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.label_url;
    } catch (error: any) {
      logger.error(`Shiprocket Generate Label Error: ${error.response?.data?.message || error.message}`);
      return "";
    }
  }

  async getTrackingInfo(awb: string): Promise<TrackingInfoResult> {
    const token = await this.getAuthToken();
    try {
      const response = await axios.get(`${this.baseUrl}/courier/track/awb/${awb}`, {
        headers: { Authorization: `Bearer ${token}` }
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
          location: activity.location,
          date: activity.date,
          activity: activity.activity
        })),
        estimatedDelivery: trackData.etd
      };
    } catch (error: any) {
      logger.error(`Shiprocket Tracking Error: ${error.response?.data?.message || error.message}`);
      return { success: false, currentStatus: "ERROR", events: [] };
    }
  }

  async getRates(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<ShippingRate[]> {
    const token = await this.getAuthToken();
    try {
      const settings = await require("../../modules/settings/setting.repository").SettingRepository.getSettings();
      const originPincode = settings?.storeOriginPincode || "411001";
      
      const response = await axios.get(`${this.baseUrl}/courier/serviceability/`, {
        params: {
          pickup_postcode: originPincode,
          delivery_postcode: deliveryPincode,
          weight: weightKg,
          cod: isCod ? 1 : 0
        },
        headers: { Authorization: `Bearer ${token}` }
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
      await axios.post(`${this.baseUrl}/orders/cancel/awb`, {
        awbs: [awb]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch (error: any) {
      logger.error(`Shiprocket Cancel Error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
