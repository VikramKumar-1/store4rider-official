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

export class DelhiveryProvider implements ShippingProvider {
  
  private baseUrl = "https://track.delhivery.com";
  
  private getHeaders() {
    const token = ENV.DELHIVERY_API_KEY;
    if (!token) {
      throw new AppError("Delhivery API credentials not configured", 500);
    }
    return {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json"
    };
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    const headers = this.getHeaders();
    const settings = await require("../../modules/settings/setting.repository").SettingRepository.getSettings();
    const originPincode = settings?.storeOriginPincode || "411001";
    const originCity = settings?.storeOriginCity || "Pune";
    
    const payload = {
      format: "json",
      data: {
        shipments: [
          {
            name: input.shippingAddress.fullName,
            add: input.shippingAddress.addressLine1,
            pin: input.shippingAddress.pincode,
            city: input.shippingAddress.city,
            state: input.shippingAddress.state,
            country: input.shippingAddress.country,
            phone: input.shippingAddress.phone,
            order: input.orderNumber,
            payment_mode: input.paymentMethod === "cod" ? "COD" : "Prepaid",
            return_pin: originPincode,
            return_city: originCity,
            return_phone: settings?.storeOriginPhone || "",
            return_add: settings?.storeOriginAddress || "",
            return_state: originCity,
            return_country: "India",
            products_desc: input.items.map(i => i.name).join(", "),
            cod_amount: input.paymentMethod === "cod" ? input.totalAmount : 0,
            weight: input.weight * 1000, // API expects grams
            length: input.length,
            breadth: input.breadth,
            height: input.height
          }
        ]
      }
    };

    try {
      const response = await axios.post(`${this.baseUrl}/api/cmu/create.json`, payload, { headers });
      
      const pkg = response.data.packages?.[0];
      if (!pkg || pkg.status !== "Success") {
        throw new AppError(pkg?.remarks?.[0] || "Failed to create Delhivery shipment", 400);
      }

      return {
        success: true,
        shipmentId: pkg.waybill, // Delhivery uses Waybill as primary ID
        awb: pkg.waybill,
        courierName: "Delhivery Surface",
        message: "Shipment created successfully in Delhivery"
      };
    } catch (error: any) {
      logger.error(`Delhivery Create Shipment Error: ${JSON.stringify(error.response?.data || error.message)}`);
      throw new AppError("Failed to create Delhivery shipment", 400);
    }
  }

  async generateLabel(shipmentId: string): Promise<string> {
    const headers = this.getHeaders();
    try {
      const response = await axios.get(`${this.baseUrl}/api/p/packing_slip`, {
        params: { wbns: shipmentId },
        headers
      });
      // Delhivery usually returns raw HTML or PDF buffers for this endpoint. 
      // Handling specifics would depend on business needs. For now, we return the track URL as a fallback label view.
      if (response.data?.packages?.length > 0) {
        return `https://track.delhivery.com/p/${shipmentId}`;
      }
      return "";
    } catch (error) {
      logger.error("Delhivery Label Generation Error", error);
      return "";
    }
  }

  async getTrackingInfo(awb: string): Promise<TrackingInfoResult> {
    const headers = this.getHeaders();
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/packages/json/`, {
        params: { waybill: awb },
        headers
      });
      
      const shipmentData = response.data.ShipmentData?.[0]?.Shipment;
      if (!shipmentData) {
        return { success: false, currentStatus: "UNKNOWN", events: [] };
      }

      const scans = shipmentData.Scans || [];

      return {
        success: true,
        currentStatus: shipmentData.Status?.Status || "UNKNOWN",
        events: scans.map((scan: any) => ({
          status: scan.ScanDetail?.ScanType || scan.ScanDetail?.Scan,
          location: scan.ScanDetail?.ScannedLocation,
          date: scan.ScanDetail?.ScanDateTime,
          activity: scan.ScanDetail?.Instructions
        })),
        estimatedDelivery: shipmentData.ExpectedDeliveryDate
      };
    } catch (error: any) {
      logger.error(`Delhivery Tracking Error: ${error.response?.data?.message || error.message}`);
      return { success: false, currentStatus: "ERROR", events: [] };
    }
  }

  async getRates(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<ShippingRate[]> {
    const headers = this.getHeaders();
    try {
      // Step 1: Check Serviceability
      const servResponse = await axios.get(`${this.baseUrl}/c/api/pin-codes/json/`, {
        params: { filter_codes: deliveryPincode },
        headers
      });

      const pinData = servResponse.data.delivery_codes?.[0]?.postal_code;
      if (!pinData) return [];

      // Step 2: Fetch actual rate
      const settings = await require("../../modules/settings/setting.repository").SettingRepository.getSettings();
      const originPincode = settings?.storeOriginPincode || "411001";
      
      const rateResponse = await axios.get(`${this.baseUrl}/api/kinko/v1/invoice/charges/.json`, {
        params: {
          md: "S", // Surface
          ss: "Delivered",
          d_pin: deliveryPincode,
          o_pin: originPincode,
          cgm: weightKg * 1000 // Convert kg to grams
        },
        headers
      });

      const rateData = rateResponse.data?.[0];
      if (!rateData || !rateData.total_amount) {
        return []; // No hardcoded fallback
      }

      return [
        {
          courierName: "Delhivery Surface",
          courierId: "delhivery_surface",
          rate: rateData.total_amount,
          estimatedDeliveryDays: pinData.sort_code || "3-4 Days",
          isCodAvailable: pinData.cod === "Y"
        }
      ];
    } catch (error: any) {
      logger.error(`Delhivery Rates Error: ${error.response?.data?.message || error.message}`);
      return [];
    }
  }

  async cancelShipment(shipmentId: string, awb: string): Promise<boolean> {
    const headers = this.getHeaders();
    try {
      await axios.post(`${this.baseUrl}/api/p/edit`, {
        waybill: awb,
        cancellation: true
      }, { headers });
      return true;
    } catch (error: any) {
      logger.error(`Delhivery Cancel Error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}
