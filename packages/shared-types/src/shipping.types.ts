export type ShipmentStatus = 
  | "pending" 
  | "ready_to_ship"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "rto_initiated" // Return To Origin
  | "rto_delivered"
  | "cancelled";

export interface ITrackingEvent {
  status: string;
  location: string;
  date: string;
  activity: string;
}

export interface IShipment {
  id?: string;
  _id?: string;
  orderId: string;
  provider: "shiprocket" | "delhivery" | "xpressbees";
  shipmentId: string; // ID returned by the provider
  awb?: string;
  courierName?: string;
  status: ShipmentStatus;
  trackingUrl?: string;
  labelUrl?: string;
  events: ITrackingEvent[];
  length: number;
  breadth: number;
  height: number;
  weight: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
