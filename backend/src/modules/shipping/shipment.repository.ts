import { IShipment, ShipmentStatus, ITrackingEvent } from "@store4riders/shared-types";
import { ShipmentModel, ShipmentDocument } from "./shipment.model";
import { ShippingTrackingEventModel } from "./models/shipping-tracking-event.model";
import mongoose, { ClientSession } from "mongoose";

// Lean document type (plain JS object returned by .lean())
type LeanShipment = IShipment & { _id: string };

export class ShipmentRepository {
  static async create(data: Partial<IShipment>, session?: ClientSession): Promise<ShipmentDocument> {
    const shipment = new ShipmentModel(data);
    return shipment.save({ session });
  }

  /**
   * Helper to attach historical webhook & sync events from ShippingTrackingEventModel
   */
  private static async attachTrackingEvents(shipments: LeanShipment[]): Promise<LeanShipment[]> {
    if (!shipments || shipments.length === 0) return [];

    const shipmentIds = shipments.map((s) => String(s._id));
    const awbs = shipments.map((s) => s.awb).filter(Boolean) as string[];

    const queryConditions: any[] = [{ shipmentId: { $in: shipmentIds } }];
    if (awbs.length > 0) {
      queryConditions.push({ awb: { $in: awbs } });
    }

    try {
      let query: any = ShippingTrackingEventModel.find({
        $or: queryConditions,
      }).sort({ eventTimestamp: -1 });

      const trackingEvents = typeof query?.lean === "function" 
        ? await query.lean().exec() 
        : (typeof query?.exec === "function" ? await query.exec() : await query);

      if (!trackingEvents || !Array.isArray(trackingEvents)) {
        return shipments;
      }

      return shipments.map((shipment) => {
        const sId = String(shipment._id);
        const matchingEvents = trackingEvents.filter(
          (e: any) => e.shipmentId === sId || (shipment.awb && e.awb === shipment.awb)
        );

        let formattedEvents: ITrackingEvent[] = matchingEvents.map((e: any) => ({
          status: e.internalState,
          providerStatus: e.providerState,
          location: e.location || "",
          timestamp: e.eventTimestamp,
          activity: e.message || e.providerState,
          description: e.message || e.providerState,
          provider: e.provider,
        }));

        if (formattedEvents.length === 0 && shipment.awb) {
          formattedEvents = [
            {
              status: shipment.status || "AWB_ASSIGNED",
              providerStatus: shipment.providerStatus || "AWB Assigned",
              location: "Warehouse Dispatch Facility",
              timestamp: shipment.createdAt || new Date(),
              activity: `AWB ${shipment.awb} assigned for delivery via ${shipment.courierName || shipment.provider?.toUpperCase() || "Courier Partner"}`,
              description: "Package packed and manifested. Ready for courier carrier pickup & transit scan.",
              provider: shipment.provider,
            },
          ];
        }

        return {
          ...shipment,
          events: formattedEvents,
        };
      });
    } catch {
      return shipments;
    }
  }

  static async findById(id: string, session?: ClientSession): Promise<LeanShipment | null> {
    let query: any = ShipmentModel.findById(id);
    if (session && typeof query?.session === "function") {
      query = query.session(session);
    }
    const shipment = typeof query?.lean === "function" ? await query.lean().exec() : await query;
    if (!shipment) return null;
    const [enriched] = await ShipmentRepository.attachTrackingEvents([shipment]);
    return enriched || shipment;
  }

  static async findByOrderId(orderId: string, session?: ClientSession): Promise<LeanShipment[]> {
    const queryConditions: any[] = [{ orderId }];

    try {
      const { OrderModel } = await import("../order/order.model");
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        let oQuery: any = OrderModel.findById(orderId).select("orderNumber");
        const order = typeof oQuery?.lean === "function" ? await oQuery.lean().exec() : await oQuery;
        if (order?.orderNumber) {
          queryConditions.push({ orderId: order.orderNumber });
        }
      } else {
        let oQuery: any = OrderModel.findOne({ orderNumber: orderId }).select("_id");
        const order = typeof oQuery?.lean === "function" ? await oQuery.lean().exec() : await oQuery;
        if (order?._id) {
          queryConditions.push({ orderId: String(order._id) });
        }
      }
    } catch {
      // Non-fatal if order model lookup fails
    }

    let query: any = ShipmentModel.find({ $or: queryConditions });
    if (session && typeof query?.session === "function") {
      query = query.session(session);
    }
    const shipments = typeof query?.lean === "function" ? await query.lean().exec() : await query;

    return ShipmentRepository.attachTrackingEvents(shipments || []);
  }

  static async findByAwb(awb: string, session?: ClientSession): Promise<LeanShipment | null> {
    let query: any = ShipmentModel.findOne({ awb });
    if (session && typeof query?.session === "function") {
      query = query.session(session);
    }
    const shipment = typeof query?.lean === "function" ? await query.lean().exec() : await query;
    if (!shipment) return null;
    const [enriched] = await ShipmentRepository.attachTrackingEvents([shipment]);
    return enriched || shipment;
  }

  static async findPaginated(query: any, page: number, limit: number, session?: ClientSession) {
    const skip = (page - 1) * limit;
    let findQuery: any = ShipmentModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
    if (session && typeof findQuery?.session === "function") {
      findQuery = findQuery.session(session);
    }
    let countQuery: any = ShipmentModel.countDocuments(query);
    if (session && typeof countQuery?.session === "function") {
      countQuery = countQuery.session(session);
    }

    const [items, total] = await Promise.all([
      typeof findQuery?.lean === "function" ? findQuery.lean().exec() : findQuery,
      typeof countQuery?.exec === "function" ? countQuery.exec() : countQuery,
    ]);
    const enrichedItems = await ShipmentRepository.attachTrackingEvents(items || []);
    return { items: enrichedItems, total: total || 0 };
  }

  static async updateStatus(
    id: string,
    status: ShipmentStatus,
    updates: Partial<IShipment> = {},
    session?: ClientSession
  ): Promise<ShipmentDocument | null> {
    return ShipmentModel.findByIdAndUpdate(
      id,
      { $set: { status, ...updates } },
      { new: true, session }
    ).exec();
  }

  static async addTrackingEvent(id: string, event: ITrackingEvent, session?: ClientSession): Promise<ShipmentDocument | null> {
    return ShipmentModel.findByIdAndUpdate(
      id,
      { $push: { events: event } },
      { new: true, session }
    ).exec();
  }
}
