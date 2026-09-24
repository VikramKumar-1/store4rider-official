import mongoose from "mongoose";
import { ShipmentRepository } from "./shipment.repository";
import { OrderRepository } from "../order/order.repository";
import { ShippingProviderFactory } from "../../core/shipping/ShippingProviderFactory";
import { AppError } from "../../core/errors/AppError";
import { ShipmentStatus, ITrackingEvent } from "@store4riders/shared-types";
import { CreateShipmentInput } from "../../core/shipping/ShippingProvider";
import { logger } from "../../core/utils/logger";

export class ShipmentService {
  
  static async createShipment(orderId: string, providerName: string, dimensions: any) {
    const session = await mongoose.startSession();
    let result = null;

    try {
      await session.withTransaction(async () => {
        const order = await OrderRepository.findById(orderId, session);
        if (!order) throw new AppError("Order not found", 404);

        if (order.status !== "confirmed" && order.status !== "processing") {
          throw new AppError(`Cannot create shipment for order in ${order.status} status`, 400);
        }

        const provider = ShippingProviderFactory.create(providerName);
        const user = await require("../user/user.repository").UserRepository.findById(order.userId, session);
        
        const input = {
          orderId: String((order as any)._id || order.id),
          orderNumber: order.orderNumber || "",
          paymentMethod: order.paymentMethod === "cod" ? "cod" : "prepaid",
          totalAmount: order.pricing?.total || 0,
          shippingAddress: order.shippingAddress as any,
          email: user?.email || "",
          items: order.items as any,
          length: dimensions.length,
          breadth: dimensions.breadth,
          height: dimensions.height,
          weight: dimensions.weight,
        };

        // Call the external shipping provider API
        const providerResult = await provider.createShipment(input as any);
        if (!providerResult.success) {
          throw new AppError(providerResult.message || "Failed to create shipment in provider", 400);
        }

        const labelUrl = await provider.generateLabel(providerResult.shipmentId);

        // Save in our DB
        const shipment = await ShipmentRepository.create({
          orderId: input.orderId,
          provider: providerName as any,
          shipmentId: providerResult.shipmentId,
          awb: providerResult.awb,
          courierName: providerResult.courierName,
          status: "pending",
          labelUrl,
          events: [],
          length: dimensions.length,
          breadth: dimensions.breadth,
          height: dimensions.height,
          weight: dimensions.weight,
        }, session);

        // Transition order status
        await OrderRepository.updateStatus(input.orderId, "processing", {}, session);

        result = shipment;
      });
    } finally {
      await session.endSession();
    }

    return result;
  }

  static async syncTracking(shipmentId: string) {
    const shipment = await ShipmentRepository.findById(shipmentId);
    if (!shipment) throw new AppError("Shipment not found", 404);
    if (!shipment.awb) throw new AppError("No AWB found for shipment", 400);

    const provider = ShippingProviderFactory.create(shipment.provider);
    const trackingInfo = await provider.getTrackingInfo(shipment.awb);

    if (trackingInfo.success && trackingInfo.events.length > 0) {
      // Find new events to append
      const existingDates = new Set(shipment.events.map(e => e.date));
      const newEvents = trackingInfo.events.filter(e => !existingDates.has(e.date));

      let latestStatus = shipment.status;
      
      // Update status mapped from provider
      if (trackingInfo.currentStatus === "DELIVERED") {
        latestStatus = "delivered";
      } else if (trackingInfo.currentStatus === "OUT_FOR_DELIVERY") {
        latestStatus = "out_for_delivery";
      } else if (trackingInfo.currentStatus === "IN_TRANSIT") {
        latestStatus = "in_transit";
      } else if (trackingInfo.currentStatus === "PICKED_UP") {
        latestStatus = "picked_up";
      } else if (trackingInfo.currentStatus === "RTO") {
        latestStatus = "rto_initiated";
      }

      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          for (const event of newEvents) {
            await ShipmentRepository.addTrackingEvent(shipmentId, event, session);
          }

          if (latestStatus !== shipment.status) {
            await ShipmentRepository.updateStatus(shipmentId, latestStatus as ShipmentStatus, {}, session);
            
            // Sync order status
            if (latestStatus === "picked_up" || latestStatus === "in_transit") {
              await OrderRepository.updateStatus(shipment.orderId, "shipped", {}, session);
            } else if (latestStatus === "delivered") {
              await OrderRepository.updateStatus(shipment.orderId, "delivered", {}, session);
            }
          }
        });
      } finally {
        await session.endSession();
      }
    }

    return await ShipmentRepository.findById(shipmentId); // return updated
  }

  static async handleWebhook(providerName: string, payload: any) {
    logger.info(`Received webhook from ${providerName}`);
    // Logic will vary wildly per provider. Stubbed for architecture.
    // E.g., lookup shipment by AWB, update status, fire tracking sync
    return { success: true };
  }

  static async compareRates(deliveryPincode: string, weightKg: number, isCod: boolean) {
    const providers = ["shiprocket", "delhivery", "xpressbees"];
    const allRates: any[] = [];

    for (const providerName of providers) {
      try {
        const provider = ShippingProviderFactory.create(providerName);
        const rates = await provider.getRates(deliveryPincode, weightKg, isCod);
        
        rates.forEach(rate => {
          allRates.push({
            provider: providerName,
            ...rate
          });
        });
      } catch (error: any) {
        logger.warn(`Failed to fetch rates from ${providerName}: ${error.message}`);
        // Continue to next provider even if one fails
      }
    }

    // Sort rates from lowest to highest
    allRates.sort((a, b) => a.rate - b.rate);

    return allRates;
  }
}
