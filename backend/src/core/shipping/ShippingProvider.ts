import { IOrder } from "@store4riders/shared-types";

export interface ShipmentAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ShipmentItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateShipmentInput {
  orderId: string;
  orderNumber: string;
  paymentMethod: "cod" | "prepaid";
  totalAmount: number;
  shippingAddress: ShipmentAddress;
  email: string; // Dynamic customer email
  items: ShipmentItem[];
  length: number; // in cm
  breadth: number; // in cm
  height: number; // in cm
  weight: number; // in kg
}

export interface CreateShipmentResult {
  success: boolean;
  shipmentId: string;
  awb?: string;
  courierName?: string;
  labelUrl?: string;
  message?: string;
}

export interface ShippingRate {
  courierName: string;
  courierId: string;
  rate: number;
  estimatedDeliveryDays: string;
  isCodAvailable: boolean;
}

export interface TrackingEvent {
  status: string; // e.g. "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"
  location: string;
  date: string;
  activity: string;
}

export interface TrackingInfoResult {
  success: boolean;
  currentStatus: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
}

export interface ShippingProvider {
  /**
   * Create a shipment in the provider's system
   */
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;

  /**
   * Generate or retrieve the shipping label URL
   */
  generateLabel(shipmentId: string): Promise<string>;

  /**
   * Get real-time tracking information
   */
  getTrackingInfo(awb: string): Promise<TrackingInfoResult>;

  /**
   * Get available shipping rates for a specific pincode/weight
   */
  getRates(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<ShippingRate[]>;

  /**
   * Cancel an existing shipment
   */
  cancelShipment(shipmentId: string, awb: string): Promise<boolean>;
}
