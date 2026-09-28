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
  timestamp: string | Date;
  activity?: string;
  description?: string;
  providerStatus?: string;
  receivedAt?: string | Date;
  providerEventId?: string;
}

export interface TrackingInfoResult {
  success: boolean;
  currentStatus: string;
  events: TrackingEvent[];
  estimatedDelivery?: string;
}

export interface ServiceabilityResult {
  serviceable: boolean;
  codAvailable: boolean;
  estimatedDays?: number;
  provider: string;
}

export interface PickupResult {
  success: boolean;
  pickupTokenNumber?: string;
  scheduledDate?: string;
  message: string;
}

export interface GetRatesInput {
  deliveryPincode: string;
  weightKg: number;
  isCod: boolean;
  length?: number;
  breadth?: number;
  height?: number;
}

export interface ShippingProvider {
  /**
   * Check if a pincode is serviceable by this provider
   */
  checkServiceability?(deliveryPincode: string, weightKg: number, isCod: boolean): Promise<ServiceabilityResult>;
  /**
   * Create a shipment in the provider's system
   */
  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;

  /**
   * Request pickup for an created shipment
   */
  requestPickup(shipmentId: string, providerOrderId?: string): Promise<PickupResult>;

  /**
   * Generate or retrieve the shipping label URL
   */
  generateLabel(shipmentId: string): Promise<string | null>;

  /**
   * Get real-time tracking information
   */
  getTrackingInfo(awb: string): Promise<TrackingInfoResult>;

  /**
   * Get available shipping rates for a specific pincode/weight
   */
  getRates(input: GetRatesInput): Promise<ShippingRate[]>;

  /**
   * Cancel an existing shipment
   */
  cancelShipment(shipmentId: string, awb: string): Promise<boolean>;

  /**
   * Verify Webhook Signature
   */
  verifyWebhookSignature(payload: any, headers: Record<string, string>): boolean;

  /**
   * Extract unique Webhook Event ID
   */
  extractWebhookEventId?(payload: any): string;

  /**
   * Parse provider webhook payload into normalized event format
   */
  parseWebhookPayload?(payload: any): import("../../modules/shipping/services/tracking.service").NormalizedTrackingEvent;
}
