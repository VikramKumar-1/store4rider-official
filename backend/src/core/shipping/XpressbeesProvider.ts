import axios from "axios";
import { 
  ShippingProvider, 
  CreateShipmentInput, 
  CreateShipmentResult, 
  ShippingRate, 
  TrackingInfoResult 
} from "./ShippingProvider";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";
import { ENV } from "../config/env";

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
    const settings = await require("../../modules/settings/setting.repository").SettingRepository.getSettings();
    const originPincode = settings?.storeOriginPincode || "411001";
    
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
      const response = await axios.post(`${this.baseUrl}/shipments`, payload, { headers });
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

  async generateLabel(shipmentId: string): Promise<string> {
    const headers = this.getHeaders();
    try {
      const response = await axios.get(`${this.baseUrl}/shipments/label/${shipmentId}`, { headers });
      return response.data.data?.label_url || "";
    } catch (error) {
      logger.error("Xpressbees Label Generation Error", error);
      return "";
    }
  }

  async getTrackingInfo(awb: string): Promise<TrackingInfoResult> {
    const headers = this.getHeaders();
    try {
      const response = await axios.get(`${this.baseUrl}/track/${awb}`, { headers });
      
      const trackData = response.data.data;
      if (!trackData || trackData.length === 0) {
        return { success: false, currentStatus: "UNKNOWN", events: [] };
      }

      return {
        success: true,
        currentStatus: trackData[0]?.status || "UNKNOWN",
        events: trackData.map((activity: any) => ({
          status: activity.status,
          location: activity.location,
          date: activity.timestamp,
          activity: activity.remark
        })),
        estimatedDelivery: trackData[0]?.expected_delivery
      };
    } catch (error: any) {
      logger.error(`Xpressbees Tracking Error: ${error.response?.data?.message || error.message}`);
      return { success: false, currentStatus: "ERROR", events: [] };
    }
  }

  async getRates(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<ShippingRate[]> {
    const headers = this.getHeaders();
    try {
      const settings = await require("../../modules/settings/setting.repository").SettingRepository.getSettings();
      const originPincode = settings?.storeOriginPincode || "411001";
      
      const response = await axios.get(`${this.baseUrl}/serviceability`, {
        params: {
          destination_pincode: deliveryPincode,
          source_pincode: originPincode,
          weight: weightKg * 1000,
          payment_type: isCod ? "COD" : "Prepaid"
        },
        headers
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
          estimatedDeliveryDays: data.estimated_delivery_days ? String(data.estimated_delivery_days) : "3-5 Days",
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
      await axios.post(`${this.baseUrl}/shipments/cancel`, { awb_number: awb }, { headers });
      return true;
    } catch (error: any) {
      logger.error(`Xpressbees Cancel Error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
