import { AppError, NotFoundError, ValidationError } from "../../core/errors/AppError";
import { ShipmentModel } from "./shipment.model";
import { ShipmentRepository } from "./shipment.repository";
import { OrderModel } from "../order/order.model";
import { ProductModel } from "../product/product.model";
import { WarehouseRepository } from "../warehouse/warehouse.repository";
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
  static async pushOrderToShiprocket(orderId: string): Promise<any> {
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

    // Get default warehouse for initial registration in Shiprocket
    const defaultWarehouse = await WarehouseRepository.findDefault();
    const pickupLocation = defaultWarehouse?.shiprocketLocationId || defaultWarehouse?.pincode;

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
      warehouseId: defaultWarehouse ? String(defaultWarehouse._id) : undefined,
    };

    const providerInstance = ShippingProviderFactory.create("shiprocket");
    const result = await providerInstance.createShipment(input);

    // Save or update Shipment in DB
    let shipment = existingShipment;
    if (!shipment) {
      shipment = new ShipmentModel({
        orderId: String(order._id),
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
      shipment.status = result.awb ? "AWB_ASSIGNED" : "SHIPMENT_CREATED";
      shipment.providerShipmentId = result.shipmentId;
      shipment.awb = result.awb;
      shipment.courierName = result.courierName;
      shipment.labelUrl = result.labelUrl;
      shipment.providerStatus = "Order pushed to Shiprocket Dashboard";
    }
    await shipment.save();

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

    if (shipment.provider === "manual") {
      return shipment;
    }

    const providerInstance = ShippingProviderFactory.create(shipment.provider);
    const trackingInfo = await providerInstance.getTrackingInfo(shipment.awb);

    if (trackingInfo.success) {
      shipment.providerStatus = trackingInfo.currentStatus;

      const normalized = trackingInfo.currentStatus.toLowerCase();
      if (normalized.includes("delivered")) {
        shipment.status = "DELIVERED";
        await OrderModel.findByIdAndUpdate(shipment.orderId, { status: "delivered" });
      } else if (normalized.includes("out for delivery")) {
        shipment.status = "OUT_FOR_DELIVERY";
      } else if (normalized.includes("transit") || normalized.includes("shipped")) {
        shipment.status = "IN_TRANSIT";
      }

      await shipment.save();
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
    const hasConfiguredCredentials = Boolean(
      (ENV.SHIPROCKET_EMAIL && ENV.SHIPROCKET_PASSWORD) ||
      ENV.DELHIVERY_API_KEY ||
      ENV.XPRESSBEES_API_KEY
    );

    // If carrier API credentials are not yet configured (e.g. dev/sandbox testing),
    // gracefully allow serviceability so order checkout testing can proceed
    if (!hasConfiguredCredentials) {
      return {
        serviceable: true,
        codAvailable: true,
        provider: "sandbox",
      };
    }

    const cacheKey = `shipping:serviceability:${deliveryPincode}:${weightKg}:${isCod}`;
    const cached = await getCache(cacheKey);
    if (cached && (cached as any).serviceable) {
      return cached;
    }

    const providers = ShippingProviderFactory.getAllProviders();
    let serviceable = false;
    let codAvailable = false;
    let fastestDays = 999;
    let selectedProvider = "shiprocket";

    for (const provider of providers) {
      if (provider.checkServiceability) {
        try {
          const res = await provider.checkServiceability(deliveryPincode, weightKg, isCod);
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

    const result = {
      serviceable,
      codAvailable,
      estimatedDays: fastestDays === 999 ? undefined : fastestDays,
      provider: selectedProvider,
    };

    // Cache for 24 hours
    await setCache(cacheKey, result, 86400);
    return result;
  }

  /**
   * Handle Webhook from Shiprocket / Delhivery / Xpressbees
   */
  static async handleWebhook(provider: string, payload: any, headers: Record<string, string>): Promise<void> {
    const providerInstance = ShippingProviderFactory.create(provider);
    const isValid = providerInstance.verifyWebhookSignature(payload, headers);
    if (!isValid) {
      throw new AppError("Invalid webhook signature", 401);
    }

    logger.info(`[ShipmentService] Processing webhook for provider: ${provider}`);

    // Shiprocket Webhook parsing
    if (provider === "shiprocket") {
      const orderNumber = payload.order_id || payload.channel_order_id;
      const awb = payload.awb || payload.awb_code;
      const courierName = payload.courier_name;
      const currentStatus = (payload.current_status || payload.shipment_status || "").toLowerCase();

      if (orderNumber || awb) {
        const shipment = await ShipmentModel.findOne({
          $or: [{ awb }, { orderId: orderNumber }],
        });

        if (shipment) {
          if (awb && !shipment.awb) shipment.awb = awb;
          if (courierName) shipment.courierName = courierName;
          shipment.providerStatus = payload.current_status || shipment.providerStatus;

          if (currentStatus.includes("delivered")) {
            shipment.status = "DELIVERED";
            await OrderModel.findByIdAndUpdate(shipment.orderId, { status: "delivered" });
          } else if (currentStatus.includes("out for delivery")) {
            shipment.status = "OUT_FOR_DELIVERY";
          } else if (currentStatus.includes("transit") || currentStatus.includes("shipped")) {
            shipment.status = "IN_TRANSIT";
            await OrderModel.findByIdAndUpdate(shipment.orderId, { status: "shipped" });
          } else if (currentStatus.includes("rto")) {
            shipment.status = "RTO_INITIATED";
          }

          await shipment.save();
          logger.info(`[ShipmentService] Updated shipment status from webhook to ${shipment.status}`);
        }
      }
    }
  }
}
