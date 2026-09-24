import mongoose, { Schema, Document } from "mongoose";
import { IShipment } from "@store4riders/shared-types";

export interface ShipmentDocument extends Omit<IShipment, "id" | "_id">, Document {}

const trackingEventSchema = new Schema(
  {
    status: { type: String, required: true },
    location: { type: String, required: true },
    date: { type: String, required: true },
    activity: { type: String, required: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema<ShipmentDocument>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["shiprocket", "delhivery", "xpressbees"],
      required: true,
    },
    shipmentId: {
      type: String,
      required: true,
      unique: true,
    },
    awb: {
      type: String,
      index: true,
    },
    courierName: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "ready_to_ship",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "rto_initiated",
        "rto_delivered",
        "cancelled"
      ],
      default: "pending",
      index: true,
    },
    trackingUrl: {
      type: String,
    },
    labelUrl: {
      type: String,
    },
    events: [trackingEventSchema],
    length: { type: Number, required: true },
    breadth: { type: Number, required: true },
    height: { type: Number, required: true },
    weight: { type: Number, required: true },
  },
  { timestamps: true }
);

// Prevent hot-reload issues
export const ShipmentModel = mongoose.models.Shipment || mongoose.model<ShipmentDocument>("Shipment", shipmentSchema);
