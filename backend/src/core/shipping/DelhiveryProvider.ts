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
    const warehouse = await WarehouseRepository.findDefault();
    if (!warehouse || !warehouse.pincode || !warehouse.city || !warehouse.state || !warehouse.addressLine1) {
      throw new AppError("Default warehouse missing pincode, city, state, or address", 500);
    }
    const originPincode = warehouse.pincode;
    const originCity = warehouse.city;
    const originState = warehouse.state;
    
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
            return_phone: warehouse.phone,
            return_add: warehouse.addressLine1 + (warehouse.addressLine2 ? `, ${warehouse.addressLine2}` : ""),
            return_state: originState,
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
      const response = await shippingPost(`${this.baseUrl}/api/cmu/create.json`, payload, { headers });
      
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

  async requestPickup(shipmentId: string, providerOrderId?: string): Promise<PickupResult> {
    // Delhivery auto-schedules pickup upon manifest creation.
    // If explicit pickup location call is needed, it would be /fm/request/pb/generate/
    // We return success immediately.
    return {
      success: true,
      message: "Pickup auto-scheduled by Delhivery on creation"
    };
  }

  async generateLabel(shipmentId: string): Promise<string | null> {
    const headers = this.getHeaders();
    try {
      const response = await shippingGet(`${this.baseUrl}/api/p/packing_slip`, {
        params: { wbns: shipmentId },
        headers,
      });
      // Delhivery usually returns raw HTML or PDF buffers for this endpoint. 
      // Handling specifics would depend on business needs. For now, we return the track URL as a fallback label view.
      if (response.data?.packages?.length > 0) {
        return `https://track.delhivery.com/p/${shipmentId}`;
      }
      return null;
    } catch (error) {
      logger.error("Delhivery Label Generation Error", error);
      return null;
    }
  }

  async getTrackingInfo(awb: string): Promise<TrackingInfoResult> {
    const headers = this.getHeaders();
    try {
      const response = await shippingGet(`${this.baseUrl}/api/v1/packages/json/`, {
        params: { waybill: awb },
        headers,
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
          providerStatus: scan.ScanDetail?.ScanType || scan.ScanDetail?.Scan,
          location: scan.ScanDetail?.ScannedLocation,
          timestamp: scan.ScanDetail?.ScanDateTime,
          activity: scan.ScanDetail?.Instructions,
          description: scan.ScanDetail?.Instructions,
        })),
        estimatedDelivery: shipmentData.ExpectedDeliveryDate
      };
    } catch (error: any) {
      logger.error(`Delhivery Tracking Error: ${error.response?.data?.message || error.message}`);
      return { success: false, currentStatus: "ERROR", events: [] };
    }
  }

  async getRates(input: GetRatesInput): Promise<ShippingRate[]> {
    const headers = this.getHeaders();
    try {
      // Step 1: Check Serviceability
      const servResponse = await shippingGet(`${this.baseUrl}/c/api/pin-codes/json/`, {
        params: { filter_codes: input.deliveryPincode },
        headers,
      });

      const pinData = servResponse.data.delivery_codes?.[0]?.postal_code;
      if (!pinData) return [];

      // Step 2: Fetch actual rate
      const warehouse = await WarehouseRepository.findDefault();
      if (!warehouse || !warehouse.pincode) {
        throw new AppError("Default warehouse pincode not configured", 500);
      }
      const originPincode = warehouse.pincode;
      
      const rateResponse = await shippingGet(`${this.baseUrl}/api/kinko/v1/invoice/charges/.json`, {
        params: {
          md: "S", // Surface
          ss: "Delivered",
          d_pin: input.deliveryPincode,
          o_pin: originPincode,
          cgm: input.weightKg * 1000 // Convert kg to grams
        },
        headers,
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
          estimatedDeliveryDays: pinData.sort_code,
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
      await shippingPost(`${this.baseUrl}/api/p/edit`, {
        waybill: awb,
        cancellation: true
      }, { headers });
      return true;
    } catch (error: any) {
      logger.error(`Delhivery Cancel Error: ${error.response?.data?.message || error.message}`);
      throw new AppError("Failed to cancel Delhivery shipment", 500);
    }
  }

  async checkServiceability(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<import("./ShippingProvider").ServiceabilityResult> {
    const headers = this.getHeaders();
    try {
      const servResponse = await shippingGet(`${this.baseUrl}/c/api/pin-codes/json/`, {
        params: { filter_codes: deliveryPincode },
        headers,
      });

      const pinData = servResponse.data.delivery_codes?.[0]?.postal_code;
      if (!pinData) {
        return { serviceable: false, codAvailable: false, provider: "delhivery" };
      }

      return {
        serviceable: true,
        codAvailable: pinData.cod === "Y",
        estimatedDays: parseInt(pinData.sort_code, 10) || undefined,
        provider: "delhivery"
      };
    } catch (error: any) {
      logger.error(`Delhivery Serviceability Error: ${error.response?.data?.message || error.message}`);
      return { serviceable: false, codAvailable: false, provider: "delhivery" };
    }
  }

  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean {
    if (!ENV.DELHIVERY_WEBHOOK_TOKEN) {
      logger.warn("DELHIVERY_WEBHOOK_TOKEN not configured. Bypassing Delhivery webhook verification (NOT SECURE).");
      return true; // Bypass only if explicitly unconfigured
    }

    // Delhivery uses a static Authorization token or custom header for webhook auth
    const token = headers["authorization"]?.replace("Bearer ", "") || headers["x-delhivery-token"];
    
    if (!token || token !== ENV.DELHIVERY_WEBHOOK_TOKEN) {
      logger.warn("Delhivery webhook unauthorized (invalid or missing token)");
      return false;
    }

    return true;
  }
}
