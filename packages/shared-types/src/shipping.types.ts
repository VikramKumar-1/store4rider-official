export type ShipmentStatus = 
  | "pending" 
  | "shipment_created"
  | "awb_assigned"
  | "ready_to_ship"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "ndr"
  | "rto_initiated"
  | "rto_in_transit"
  | "rto_delivered"
  | "cancelled"
  | "lost"
  | "damaged"
  | "failed";

export interface ITrackingEvent {
  status: string;
  providerStatus?: string;
  location: string;
  timestamp: string | Date;
  activity?: string; // Kept for backwards compatibility
  description?: string;
  receivedAt?: string | Date;
  providerEventId?: string;
}

export interface IShipment {
  id?: string;
  _id?: string;
  orderId: string;
  provider: "shiprocket" | "delhivery" | "xpressbees";
  shipmentType: "forward" | "reverse";
  providerOrderId?: string;
  shipmentId: string; // ID returned by the provider
  awb?: string;
  courierName?: string;
  status: ShipmentStatus;
  providerStatus?: string;
  trackingUrl?: string;
  labelUrl?: string;
  events: ITrackingEvent[];
  length: number;
  breadth: number;
  height: number;
  weight: number;
  volumetricWeight?: number;
  chargeableWeight?: number;
  pickupStatus?: "pending" | "scheduled" | "picked" | "failed";
  pickupScheduledDate?: string | Date;
  estimatedDeliveryDate?: string | Date;
  customerShippingCharge?: number;
  providerShippingCharge?: number;
  codFee?: number;
  idempotencyKey?: string;
  podReference?: string;
  invoiceUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
