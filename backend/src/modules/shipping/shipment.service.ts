import mongoose from "mongoose";
import { AppError, NotFoundError, ValidationError } from "../../core/errors/AppError";
import { ShipmentModel } from "./shipment.model";
import { ShipmentRepository } from "./shipment.repository";
import { OrderModel } from "../order/order.model";
import { ProductModel } from "../product/product.model";
import { WarehouseRepository } from "../warehouse/warehouse.repository";
import { WarehouseModel } from "../warehouse/warehouse.model";
import { PincodeRepository } from "../pincode/pincode.repository";
import { ShippingProviderFactory } from "../../core/shipping/ShippingProviderFactory";
import { CreateShipmentInput } from "../../core/shipping/ShippingProvider";
import { logger } from "../../core/utils/logger";
import { getCache, setCache } from "../../core/cache/redis";
import { ENV } from "../../core/config/env";

export class ShipmentService {
  /**
   * Action 1: Push Order to Shiprocket (Option B flow).
   * Creates unfulfilled order in Shiprocket Dashboard where Admin can
   * open the order, select Pickup Location (Kolkata/Pune etc.), edit weight,
   * choose courier, and print labels.
   */
  static async pushOrderToShiprocket(orderId: string, warehouseId?: string): Promise<any> {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    // Check if shipment already created for this order
    const existingShipment = await ShipmentModel.findOne({ orderId });
    if (existingShipment && existingShipment.provider === "shiprocket" && existingShipment.providerShipmentId) {
      return {
        shipment: existingShipment,
        message: "Order already pushed to Shiprocket",
      };
    }

    // Calculate total weight from order products
    let totalWeight = 0;
    try {
      const productIds = order.items.map((i: any) => i.productId);
      const products = await ProductModel.find({ _id: { $in: productIds } }).select("weight").lean().exec();
      const weightMap = new Map(products.map((p: any) => [String(p._id), p.weight || 0.5]));

      for (const item of order.items) {
        const itemWeight = weightMap.get(String(item.productId)) || 0.5;
        totalWeight += itemWeight * item.quantity;
      }
    } catch {
      totalWeight = order.items.length * 0.5;
    }
    if (totalWeight <= 0) totalWeight = 0.5;

    // Resolve warehouse: explicitly passed > order.warehouseId > default warehouse
    let targetWarehouse: any = null;
    if (warehouseId) {
      targetWarehouse = await WarehouseRepository.findById(warehouseId);
    } else if (order.warehouseId) {
      targetWarehouse = await WarehouseRepository.findById(order.warehouseId);
    }
    if (!targetWarehouse) {
      targetWarehouse = await WarehouseRepository.findDefault();
    }
    const pickupLocation = targetWarehouse?.shiprocketLocationId || targetWarehouse?.pincode;

    const input: CreateShipmentInput = {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod === "cod" ? "cod" : "prepaid",
      totalAmount: order.pricing.codAmountToCollect || order.pricing.total,
      shippingAddress: {
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        addressLine1: order.shippingAddress.addressLine1 || order.shippingAddress.street || "",
        addressLine2: order.shippingAddress.addressLine2 || "",
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        country: order.shippingAddress.country || "India",
      },
      email: order.guestEmail || "customer@store4riders.com",
      items: order.items.map((i: any) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      length: 15,
      breadth: 15,
      height: 10,
      weight: Number(totalWeight.toFixed(2)),
      warehouseId: targetWarehouse ? String(targetWarehouse._id) : undefined,
    };

    const providerInstance = ShippingProviderFactory.create("shiprocket");
    const result = await providerInstance.createShipment(input);

    // Save or update Shipment in DB
    let shipment = existingShipment;
    if (!shipment) {
      shipment = new ShipmentModel({
        orderId: String(order._id),
        warehouseId: targetWarehouse ? String(targetWarehouse._id) : undefined,
        provider: "shiprocket",
        shipmentType: "forward",
        status: result.awb ? "AWB_ASSIGNED" : "SHIPMENT_CREATED",
        providerShipmentId: result.shipmentId,
        awb: result.awb,
        courierName: result.courierName,
        labelUrl: result.labelUrl,
        providerStatus: "Order pushed to Shiprocket Dashboard",
        totalWeight: totalWeight,
        customerShippingCharge: order.pricing.shipping,
        codFee: order.paymentMethod === "cod" ? order.pricing.codAmountToCollect : 0,
        idempotencyKey: `sr_${order._id}`,
      });
    } else {
      shipment.provider = "shiprocket";
      if (targetWarehouse) {
        shipment.warehouseId = String(targetWarehouse._id);
      }
      shipment.status = result.awb ? "AWB_ASSIGNED" : "SHIPMENT_CREATED";
      shipment.providerShipmentId = result.shipmentId;
      shipment.awb = result.awb;
      shipment.courierName = result.courierName;
      shipment.labelUrl = result.labelUrl;
      shipment.providerStatus = "Order pushed to Shiprocket Dashboard";
    }
    await shipment.save();

    if (targetWarehouse) {
      order.warehouseId = String(targetWarehouse._id);
    }

    // Update Order with note
    order.notes.push({
      text: `Pushed to Shiprocket Dashboard (Shipment ID: ${result.shipmentId}). Admin can fulfill and assign warehouse in Shiprocket.`,
      author: "admin",
      timestamp: new Date(),
    });
    if (order.status === "confirmed") {
      order.status = "packed";
    }
    await order.save();

    logger.info(`[ShipmentService] Order ${order.orderNumber} successfully pushed to Shiprocket (ID: ${result.shipmentId})`);

    return {
      success: true,
      shipment,
      message: "Order successfully sent to Shiprocket Dashboard",
    };
  }

  /**
   * Action 2: Direct Carrier Shipment (Failover / Alternative flow).
   * Dispatches order directly via Delhivery or Xpressbees using merchant's direct credentials.
   * Admin selects warehouse (Kolkata/Pune) directly in Store4Riders modal.
   */
  static async createDirectShipment(params: {
    orderId: string;
    provider: "delhivery" | "xpressbees";
    warehouseId: string;
    weightKg: number;
    length?: number;
    breadth?: number;
    height?: number;
  }): Promise<any> {
    const { orderId, provider, warehouseId, weightKg, length = 15, breadth = 15, height = 10 } = params;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    const warehouse = await WarehouseRepository.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundError("Warehouse");
    }

    const input: CreateShipmentInput = {
      warehouseId,
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod === "cod" ? "cod" : "prepaid",
      totalAmount: order.pricing.codAmountToCollect || order.pricing.total,
      shippingAddress: {
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        addressLine1: order.shippingAddress.addressLine1 || order.shippingAddress.street || "",
        addressLine2: order.shippingAddress.addressLine2 || "",
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        pincode: order.shippingAddress.pincode,
        country: order.shippingAddress.country || "India",
      },
      email: order.guestEmail || "customer@store4riders.com",
      items: order.items.map((i: any) => ({
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      length,
      breadth,
      height,
      weight: weightKg,
    };

    const providerInstance = ShippingProviderFactory.create(provider);
    const result = await providerInstance.createShipment(input);

    const shipment = new ShipmentModel({
      orderId: String(order._id),
      provider,
      shipmentType: "forward",
      status: result.awb ? "AWB_ASSIGNED" : "SHIPMENT_CREATED",
      providerShipmentId: result.shipmentId,
      awb: result.awb,
      warehouseId,
      courierName: result.courierName || provider,
      labelUrl: result.labelUrl,
      providerStatus: `Dispatched via ${provider} from ${warehouse.name}`,
      totalWeight: weightKg,
      customerShippingCharge: order.pricing.shipping,
      codFee: order.paymentMethod === "cod" ? order.pricing.codAmountToCollect : 0,
      idempotencyKey: `direct_${provider}_${order._id}`,
    });
    await shipment.save();

    // Transition Order to shipped if AWB assigned
    if (result.awb) {
      order.status = "shipped";
    } else {
      order.status = "packed";
    }
    order.warehouseId = warehouseId;
    order.notes.push({
      text: `Dispatched directly via ${provider.toUpperCase()} from ${warehouse.name} (AWB: ${result.awb || "Pending"})`,
      author: "admin",
      timestamp: new Date(),
    });
    await order.save();

    logger.info(`[ShipmentService] Order ${order.orderNumber} dispatched via direct ${provider} (AWB: ${result.awb})`);

    return {
      success: true,
      shipment,
      message: `Dispatched successfully via ${provider.toUpperCase()}`,
    };
  }

  /**
   * Action 3: Manual AWB Entry (Emergency / Offline Franchise).
   */
  static async createManualShipment(params: {
    orderId: string;
    courierName: string;
    awb: string;
    trackingUrl?: string;
  }): Promise<any> {
    const { orderId, courierName, awb, trackingUrl } = params;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order");
    }

    if (!awb || !courierName) {
      throw new ValidationError("Courier name and AWB number are required");
    }

    const shipment = new ShipmentModel({
      orderId: String(order._id),
      provider: "manual",
      shipmentType: "forward",
      status: "AWB_ASSIGNED",
      awb,
      courierName,
      trackingUrl,
      providerStatus: `Manually dispatched via ${courierName}`,
      customerShippingCharge: order.pricing.shipping,
      idempotencyKey: `manual_${order._id}_${Date.now()}`,
    });
    await shipment.save();

    order.status = "shipped";
    order.notes.push({
      text: `Manually dispatched via ${courierName} (AWB: ${awb})`,
      author: "admin",
      timestamp: new Date(),
    });
    await order.save();

    return {
      success: true,
      shipment,
      message: "Manual shipment recorded and order marked as shipped",
    };
  }

  /**
   * Fetch shipments for a customer order
   */
  static async getShipmentsByOrderId(orderId: string) {
    return ShipmentRepository.findByOrderId(orderId);
  }

  /**
   * Paginated shipments list for Admin Dashboard
   */
  static async getPaginatedShipments(query: any, page: number, limit: number) {
    return ShipmentRepository.findPaginated(query, page, limit);
  }

  /**
   * Single shipment by ID
   */
  static async getShipmentById(id: string) {
    const shipment = await ShipmentRepository.findById(id);
    if (!shipment) {
      throw new NotFoundError("Shipment");
    }
    return shipment;
  }

  /**
   * Live tracking sync from Courier Provider
   */
  static async syncTracking(shipmentId: string): Promise<any> {
    const shipment = await ShipmentModel.findById(shipmentId);
    if (!shipment) {
      throw new NotFoundError("Shipment");
    }

    if (!shipment.awb) {
      throw new AppError("No AWB assigned to this shipment yet", 400);
    }

    let activeProvider = shipment.provider;
    if (activeProvider === "manual") {
      const cName = (shipment.courierName || "").toLowerCase();
      if (cName.includes("shiprocket")) {
        activeProvider = "shiprocket";
      } else if (cName.includes("delhivery")) {
        activeProvider = "delhivery";
      } else if (cName.includes("xpressbees")) {
        activeProvider = "xpressbees";
      } else {
        return shipment;
      }
    }

    if (!shipment.trackingUrl && shipment.awb) {
      if (activeProvider === "shiprocket") {
        shipment.trackingUrl = `https://shiprocket.co/tracking/${shipment.awb}`;
      } else if (activeProvider === "delhivery") {
        shipment.trackingUrl = `https://www.delhivery.com/track/package/${shipment.awb}`;
      } else if (activeProvider === "xpressbees") {
        shipment.trackingUrl = `https://www.xpressbees.com/track?awb=${shipment.awb}`;
      }
    }

    const providerInstance = ShippingProviderFactory.create(activeProvider);
    const trackingInfo = await providerInstance.getTrackingInfo(shipment.awb);

    if (trackingInfo.success) {
      shipment.providerStatus = trackingInfo.currentStatus;

      const normalized = trackingInfo.currentStatus.toLowerCase();
      if (normalized.includes("delivered")) {
        shipment.status = "DELIVERED";
        await OrderModel.findByIdAndUpdate(shipment.orderId, { status: "delivered", $unset: { invoiceUrl: 1 } });
      } else if (normalized.includes("out for delivery")) {
        shipment.status = "OUT_FOR_DELIVERY";
      } else if (normalized.includes("transit") || normalized.includes("shipped")) {
        shipment.status = "IN_TRANSIT";
      }

      await shipment.save();

      if (trackingInfo.events && trackingInfo.events.length > 0) {
        try {
          const { ShippingTrackingEventModel } = await import("./models/shipping-tracking-event.model");
          for (const ev of trackingInfo.events) {
            const evTimestamp = ev.timestamp ? new Date(ev.timestamp) : new Date();
            await ShippingTrackingEventModel.updateOne(
              {
                shipmentId: String(shipment._id),
                internalState: shipment.status,
                eventTimestamp: evTimestamp,
              },
              {
                $setOnInsert: {
                  shipmentId: String(shipment._id),
                  awb: shipment.awb,
                  provider: shipment.provider,
                  internalState: shipment.status,
                  providerState: ev.providerStatus || ev.status || trackingInfo.currentStatus,
                  location: ev.location,
                  message: ev.activity || ev.description,
                  eventTimestamp: evTimestamp,
                },
              },
              { upsert: true }
            );
          }
        } catch {
          // Gracefully continue
        }
      }
    }

    return shipment;
  }

  /**
   * Request Courier Pickup
   */
  static async requestPickup(shipmentId: string): Promise<any> {
    const shipment = await ShipmentModel.findById(shipmentId);
    if (!shipment) {
      throw new NotFoundError("Shipment");
    }

    if (shipment.provider === "manual") {
      shipment.pickupStatus = "PICKED";
      await shipment.save();
      return { success: true, message: "Manual pickup recorded" };
    }

    const providerInstance = ShippingProviderFactory.create(shipment.provider);
    const result = await providerInstance.requestPickup(shipment.providerShipmentId || shipment.awb || "");

    if (result.success) {
      shipment.pickupStatus = "SCHEDULED";
      await shipment.save();
    }

    return result;
  }

  /**
   * Check Pincode Serviceability with Redis Caching
   */
  static async checkServiceability(deliveryPincode: string, weightKg: number = 0.5, isCod: boolean = false) {
    const cleanPincode = (deliveryPincode || "").trim();
    const isValidIndianPincode = /^[1-9][0-9]{5}$/.test(cleanPincode);

    // If pincode is not 6 digits, it cannot be serviced
    if (!isValidIndianPincode) {
      return {
        serviceable: false,
        codAvailable: false,
        message: "Please enter a valid 6-digit Indian PIN code",
      };
    }

    const isPlaceholder = (val?: string) =>
      !val ||
      val.includes("example.com") ||
      val.includes("your_") ||
      val.includes("placeholder") ||
      val.trim() === "";

    const hasConfiguredCredentials = Boolean(
      (!isPlaceholder(ENV.SHIPROCKET_EMAIL) && !isPlaceholder(ENV.SHIPROCKET_PASSWORD)) ||
      !isPlaceholder(ENV.DELHIVERY_API_KEY) ||
      !isPlaceholder(ENV.XPRESSBEES_API_KEY)
    );

    // 1. If carrier API credentials are not yet configured (e.g. dev/sandbox testing or flat rate delivery),
    // verify against our master database of 19,586 authentic Indian Post Office PIN codes!
    if (!hasConfiguredCredentials) {
      const pincodeDoc = await PincodeRepository.findByPincode(cleanPincode);
      if (!pincodeDoc) {
        return {
          serviceable: false,
          codAvailable: false,
          message: `PIN code ${cleanPincode} is not a valid Indian postal location`,
        };
      }
      return {
        serviceable: true,
        codAvailable: true,
        provider: "standard",
        district: pincodeDoc.district,
        state: pincodeDoc.state,
      };
    }

    const cacheKey = `shipping:serviceability:${cleanPincode}:${weightKg}:${isCod}`;
    const cached = await getCache(cacheKey);
    if (cached && (cached as any).serviceable) {
      return cached;
    }

    const providers = ShippingProviderFactory.getAllProviders();
    let serviceable = false;
    let codAvailable = false;
    let fastestDays = 999;
    let selectedProvider = "standard";
    let hasLiveSuccessfulResponse = false;

    for (const provider of providers) {
      if (provider.checkServiceability) {
        try {
          const res = await provider.checkServiceability(cleanPincode, weightKg, isCod);
          hasLiveSuccessfulResponse = true;
          if (res.serviceable) {
            serviceable = true;
            if (res.codAvailable) codAvailable = true;
            if (res.estimatedDays && res.estimatedDays < fastestDays) {
              fastestDays = res.estimatedDays;
              selectedProvider = res.provider;
            }
          }
        } catch (err: any) {
          logger.warn(`Serviceability check failed for a provider: ${err.message}`);
        }
      }
    }

    // 2. If live provider APIs were unreachable or failed authentication (e.g. timeout, downtime),
    // check against our verified master database of 19,586 Indian Post Office PIN codes!
    // If it's a real postal location, allow standard/Speed Post delivery so checkout is not blocked.
    // If it's a fake/non-existent PIN code, reject it.
    if (!hasLiveSuccessfulResponse) {
      const pincodeDoc = await PincodeRepository.findByPincode(cleanPincode);
      if (pincodeDoc) {
        return {
          serviceable: true,
          codAvailable: true,
          provider: "standard",
          district: pincodeDoc.district,
          state: pincodeDoc.state,
        };
      }
      return {
        serviceable: false,
        codAvailable: false,
        message: `PIN code ${cleanPincode} is not a valid Indian postal location`,
      };
    }

    const result = {
      serviceable,
      codAvailable,
      estimatedDays: fastestDays === 999 ? undefined : fastestDays,
      provider: selectedProvider,
    };

    // Cache successful serviceability for 24 hours
    if (serviceable) {
      await setCache(cacheKey, result, 86400);
    }
    return result;
  }

  /**
   * Handle Webhook from Shiprocket / Delhivery / Xpressbees
   * Automatically syncs:
   * 1. AWB & Live Tracking Status
   * 2. Pickup Warehouse chosen in Courier Dashboard (Shiprocket / Delhivery / Xpressbees)
   * 3. Order Origin State for Intra-State vs Inter-State GST Tax Invoices
   */
  static async handleWebhook(provider: string, payload: any, headers: Record<string, string>): Promise<void> {
    const providerInstance = ShippingProviderFactory.create(provider);
    const isValid = providerInstance.verifyWebhookSignature(payload, headers);
    if (!isValid) {
      throw new AppError("Invalid webhook signature", 401);
    }

    logger.info(`[ShipmentService] Processing webhook for provider: ${provider}`);

    // Universal normalization across courier payloads
    let orderRef: string | undefined;
    let awb: string | undefined;
    let courierName: string | undefined;
    let currentStatusRaw: string = "";
    let pickupLocationName: string | undefined;
    let pickupLocationId: string | undefined;
    let pickupPincode: string | undefined;
    let pickupState: string | undefined;
    let pickupCity: string | undefined;

    if (provider === "shiprocket") {
      orderRef = payload.channel_order_id || payload.order_id;
      awb = payload.awb || payload.awb_code;
      courierName = payload.courier_name;
      currentStatusRaw = (payload.current_status || payload.shipment_status || "").toLowerCase();
      pickupLocationName = (payload.pickup_location || payload.pickup_location_name || payload.origin || "").trim();
      pickupLocationId = payload.pickup_location_id ? String(payload.pickup_location_id) : undefined;
      pickupPincode = payload.pickup_pincode || payload.origin_pincode;
      pickupState = payload.pickup_state || payload.origin_state;
      pickupCity = payload.pickup_city || payload.origin_city;
    } else if (provider === "delhivery") {
      orderRef = payload.ref_num || payload.order_id || payload.client;
      awb = payload.waybill || payload.awb;
      courierName = "Delhivery";
      currentStatusRaw = (payload.status || payload.current_status || "").toLowerCase();
      pickupLocationName = (payload.pickup_location || payload.origin || "").trim();
      pickupPincode = payload.origin_pincode || payload.pickup_pincode;
      pickupState = payload.origin_state || payload.pickup_state;
      pickupCity = payload.origin_city || payload.pickup_city;
    } else if (provider === "xpressbees") {
      orderRef = payload.order_number || payload.order_id;
      awb = payload.awb || payload.tracking_id;
      courierName = "Xpressbees";
      currentStatusRaw = (payload.status || payload.current_status || "").toLowerCase();
      pickupLocationName = (payload.pickup_location || payload.origin || "").trim();
      pickupLocationId = payload.warehouse_id || payload.pickup_location_id;
      pickupPincode = payload.origin_pincode || payload.pickup_pincode;
      pickupState = payload.origin_state || payload.pickup_state;
      pickupCity = payload.origin_city;
    }

    // Resolve Order in DB
    let order: any = null;
    if (orderRef) {
      order = await OrderModel.findOne({
        $or: [
          { orderNumber: orderRef },
          ...(mongoose.Types.ObjectId.isValid(orderRef) ? [{ _id: orderRef }] : []),
        ],
      });
    }

    // Resolve Shipment in DB
    let shipment: any = null;
    const shipmentQuery: any[] = [];
    if (awb) shipmentQuery.push({ awb });
    if (order) shipmentQuery.push({ orderId: String(order._id) });
    if (orderRef) shipmentQuery.push({ orderId: orderRef });

    if (shipmentQuery.length > 0) {
      shipment = await ShipmentModel.findOne({ $or: shipmentQuery });
    }

    if (!order && shipment?.orderId) {
      order = await OrderModel.findById(shipment.orderId);
    }

    // Match or Register Warehouse selected in Courier Dashboard
    let matchedWarehouse: any = null;
    if (pickupLocationName || pickupLocationId || pickupPincode) {
      const whQueries: any[] = [];
      if (provider === "shiprocket" && pickupLocationName) {
        whQueries.push({ shiprocketLocationId: pickupLocationName });
      }
      if (provider === "delhivery" && pickupLocationName) {
        whQueries.push({ delhiveryWarehouseName: pickupLocationName });
      }
      if (provider === "xpressbees" && pickupLocationId) {
        whQueries.push({ xpressbeesWarehouseId: pickupLocationId });
      }
      if (pickupLocationName) {
        whQueries.push({ name: new RegExp(`^${pickupLocationName}$`, "i") });
        whQueries.push({ warehouseCode: new RegExp(`^${pickupLocationName}$`, "i") });
      }
      if (pickupPincode) {
        whQueries.push({ pincode: String(pickupPincode).trim() });
      }

      if (whQueries.length > 0) {
        matchedWarehouse = await WarehouseModel.findOne({ $or: whQueries }).lean();
      }

      // Auto-register warehouse if new pickup location & state arrived from courier
      if (!matchedWarehouse && pickupLocationName && pickupState) {
        try {
          matchedWarehouse = await WarehouseModel.create({
            name: pickupLocationName,
            warehouseCode: pickupLocationName.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15) || "WH_" + Date.now(),
            contactPerson: "Courier Dispatch Hub",
            phone: "0000000000",
            email: "logistics@store4riders.com",
            addressLine1: pickupLocationName,
            city: pickupCity || pickupState,
            state: pickupState,
            pincode: pickupPincode ? String(pickupPincode).trim() : "411001",
            shiprocketLocationId: provider === "shiprocket" ? pickupLocationName : undefined,
            delhiveryWarehouseName: provider === "delhivery" ? pickupLocationName : undefined,
            xpressbeesWarehouseId: provider === "xpressbees" ? pickupLocationId : undefined,
            isDefault: false,
            isActive: true,
          });
          logger.info(`[ShipmentService] Auto-registered warehouse '${pickupLocationName}' in '${pickupState}' from ${provider} webhook`);
        } catch (err: any) {
          logger.warn(`[ShipmentService] Could not auto-create warehouse: ${err.message}`);
        }
      }
    }

    if (shipment) {
      if (awb && !shipment.awb) shipment.awb = awb;
      if (courierName) shipment.courierName = courierName;
      shipment.providerStatus = payload.current_status || payload.status || shipment.providerStatus;

      if (matchedWarehouse) {
        shipment.warehouseId = String(matchedWarehouse._id);
      }

      if (currentStatusRaw.includes("delivered")) {
        shipment.status = "DELIVERED";
        if (order) await OrderModel.findByIdAndUpdate(order._id, { status: "delivered", $unset: { invoiceUrl: 1 } });
      } else if (currentStatusRaw.includes("out for delivery")) {
        shipment.status = "OUT_FOR_DELIVERY";
      } else if (currentStatusRaw.includes("transit") || currentStatusRaw.includes("shipped")) {
        shipment.status = "IN_TRANSIT";
        if (order && order.status !== "shipped" && order.status !== "delivered") {
          await OrderModel.findByIdAndUpdate(order._id, { status: "shipped" });
        }
      } else if (currentStatusRaw.includes("rto")) {
        shipment.status = "RTO_INITIATED";
      }

      await shipment.save();
      logger.info(`[ShipmentService] Updated shipment status from ${provider} webhook to ${shipment.status}`);
    }

    // Sync Order warehouse and invalidate cached invoice URL
    if (order && matchedWarehouse) {
      order.warehouseId = String(matchedWarehouse._id);
      order.invoiceUrl = undefined; // Invalidate cached invoice URL so PDF regenerates with live warehouse origin state
      order.notes.push({
        text: `Dispatch warehouse synced from ${provider.toUpperCase()} Dashboard: ${matchedWarehouse.name} (${matchedWarehouse.state} - ${matchedWarehouse.pincode})`,
        author: "system",
        timestamp: new Date(),
      });
      await order.save();
      logger.info(`[ShipmentService] Order ${order.orderNumber} warehouse updated to ${matchedWarehouse.name} (${matchedWarehouse.state})`);
    }
  }
}
