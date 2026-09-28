import { ITrackingEvent } from "@store4riders/shared-types";

export interface ParsedWebhook {
  awb: string;
  providerEventId: string;
  normalizedStatus: string;
  providerStatus: string;
  event: ITrackingEvent;
}

export class WebhookParser {
  static parseShiprocket(payload: any): ParsedWebhook | null {
    if (!payload || !payload.awb) return null;
    
    const statusMapping: Record<string, string> = {
      "1": "awb_assigned",
      "2": "ready_to_ship",
      "3": "picked_up",
      "4": "in_transit",
      "5": "out_for_delivery",
      "7": "delivered",
      "8": "cancelled",
      "9": "rto_initiated",
      "10": "rto_delivered"
    };

    const statusId = String(payload.current_status_id);
    const normalizedStatus = statusMapping[statusId] || "in_transit";

    // Generate idempotency key
    const providerEventId = `SR-${payload.awb}-${payload.current_status_id}-${payload.date || Date.now()}`;

    return {
      awb: payload.awb,
      providerEventId,
      normalizedStatus,
      providerStatus: payload.current_status,
      event: {
        status: payload.current_status,
        location: payload.scans?.[0]?.location || "",
        timestamp: new Date(payload.date || Date.now()).toISOString(),
        description: payload.current_status,
        providerEventId
      }
    };
  }

  static parseDelhivery(payload: any): ParsedWebhook | null {
    if (!payload || !payload.Awb) return null;

    const statusObj = payload.Status || {};
    const statusMapping: Record<string, string> = {
      "Manifested": "awb_assigned",
      "In Transit": "in_transit",
      "Dispatched": "in_transit",
      "Pending": "pending",
      "Out for Delivery": "out_for_delivery",
      "Delivered": "delivered",
      "RTO": "rto_initiated",
      "Cancelled": "cancelled"
    };

    const providerStatus = statusObj.Status || "Unknown";
    const normalizedStatus = statusMapping[providerStatus] || "in_transit";
    const eventTime = statusObj.StatusDateTime || new Date().toISOString();
    const providerEventId = `DEL-${payload.Awb}-${providerStatus}-${eventTime}`;

    return {
      awb: payload.Awb,
      providerEventId,
      normalizedStatus,
      providerStatus,
      event: {
        status: providerStatus,
        location: statusObj.StatusLocation || "",
        timestamp: new Date(eventTime).toISOString(),
        description: statusObj.Instructions || providerStatus,
        providerEventId
      }
    };
  }

  static parseXpressbees(payload: any): ParsedWebhook | null {
    if (!payload || !payload.awb_number) return null;

    const statusMapping: Record<string, string> = {
      "Manifested": "awb_assigned",
      "InTransit": "in_transit",
      "OutForDelivery": "out_for_delivery",
      "Delivered": "delivered",
      "RTO": "rto_initiated",
      "Cancelled": "cancelled"
    };

    const providerStatus = payload.current_status || "Unknown";
    const normalizedStatus = statusMapping[providerStatus] || "in_transit";
    const eventTime = payload.status_date || new Date().toISOString();
    const providerEventId = `XB-${payload.awb_number}-${providerStatus}-${eventTime}`;

    return {
      awb: payload.awb_number,
      providerEventId,
      normalizedStatus,
      providerStatus,
      event: {
        status: providerStatus,
        location: payload.location || "",
        timestamp: new Date(eventTime).toISOString(),
        description: payload.activity || providerStatus,
        providerEventId
      }
    };
  }

  static parse(providerName: string, payload: any): ParsedWebhook | null {
    switch (providerName.toLowerCase()) {
      case "shiprocket":
        return this.parseShiprocket(payload);
      case "delhivery":
        return this.parseDelhivery(payload);
      case "xpressbees":
        return this.parseXpressbees(payload);
      default:
        return null;
    }
  }
}
