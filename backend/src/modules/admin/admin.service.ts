import mongoose from "mongoose";
import { OrderModel } from "../order/order.model";
import { UserModel } from "../user/user.model";
import { ProductModel } from "../product/product.model";
import { ShipmentModel } from "../shipping/shipment.model";
import { indexProduct, removeProductFromIndex } from "../../core/search/meilisearch";
import { getCache, setCache } from "../../core/cache/redis";

export class AdminService {
  static async getDashboardStats(userRole?: string) {
    const isLogisticRole = userRole === "logistic";
    const cacheKey = `admin_dashboard_stats_${isLogisticRole ? "logistic" : "all"}`;
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const [totalOrders, customers, products, lowStockCount, pendingFulfillments, activeShipments, revenueResult] = await Promise.all([
      OrderModel.countDocuments(),
      isLogisticRole ? Promise.resolve(0) : UserModel.countDocuments({ role: "customer" }),
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ stockStatus: 0 }),
      OrderModel.countDocuments({ status: { $in: ["confirmed", "processing", "packed"] } }),
      ShipmentModel.countDocuments({ status: { $in: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "PICKED_UP"] } }),
      isLogisticRole 
        ? Promise.resolve([])
        : OrderModel.aggregate([
            { $match: { status: { $ne: "cancelled" } } },
            { $group: { _id: null, totalRevenue: { $sum: "$pricing.total" } } }
          ])
    ]);

    const totalRevenue = isLogisticRole ? 0 : (revenueResult[0]?.totalRevenue || 0);

    const result = {
      totalOrders,
      totalRevenue,
      customers,
      products,
      lowStockCount,
      pendingFulfillments,
      activeShipments,
    };

    await setCache(cacheKey, result, 45); // 45s TTL for snappy sub-millisecond dashboard loads
    return result;
  }

  static async getLogisticsDashboardStats(options: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 10));
    const skip = (page - 1) * limit;
    const now = Date.now();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Fetch the last 24 intake orders to compute live 24-order funnel metrics (lightweight projection)
    const last24Orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(24)
      .select("_id createdAt status paymentMethod")
      .lean()
      .exec();

    const last24OrderIds = last24Orders.map((o) => String(o._id));
    const last24Shipments = last24OrderIds.length > 0
      ? await ShipmentModel.find({ orderId: { $in: last24OrderIds } })
          .select("orderId provider courierName status")
          .lean()
          .exec()
      : [];

    const last24ShipmentMap = new Map<string, any>();
    for (const sh of last24Shipments) {
      last24ShipmentMap.set(String(sh.orderId), sh);
    }

    let last24New = 0;
    let last24Packed = 0;
    let last24InTransit = 0;
    let last24OutForDelivery = 0;
    let last24Delivered = 0;
    let last24Issues = 0;
    let last24SlaBreached = 0;
    let last24Cod = 0;
    let last24Prepaid = 0;
    const carrierBreakdown: Record<string, number> = {};

    for (const order of last24Orders) {
      const shipment = last24ShipmentMap.get(String(order._id));
      const orderCreatedAt = order.createdAt ? new Date(order.createdAt).getTime() : now;
      const isOlderThan24h = (now - orderCreatedAt) > twentyFourHoursMs;

      let fulfillmentStatus: "NEW" | "PACKED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "ISSUE" = "NEW";

      if (shipment) {
        const shStatus = (shipment.status || "").toUpperCase();
        if (shStatus === "DELIVERED") {
          fulfillmentStatus = "DELIVERED";
        } else if (shStatus === "OUT_FOR_DELIVERY") {
          fulfillmentStatus = "OUT_FOR_DELIVERY";
        } else if (["PICKED_UP", "IN_TRANSIT"].includes(shStatus)) {
          fulfillmentStatus = "IN_TRANSIT";
        } else if (["READY_TO_SHIP", "AWB_ASSIGNED", "SHIPMENT_CREATED"].includes(shStatus)) {
          fulfillmentStatus = "PACKED";
        } else if (["NDR", "RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED", "FAILED", "LOST", "DAMAGED"].includes(shStatus)) {
          fulfillmentStatus = "ISSUE";
        }
      } else {
        const ordStatus = (order.status || "").toLowerCase();
        if (ordStatus === "delivered") {
          fulfillmentStatus = "DELIVERED";
        } else if (ordStatus === "shipped") {
          fulfillmentStatus = "IN_TRANSIT";
        } else if (ordStatus === "packed") {
          fulfillmentStatus = "PACKED";
        } else if (["return_requested", "failed", "cancelled"].includes(ordStatus)) {
          fulfillmentStatus = "ISSUE";
        } else {
          fulfillmentStatus = "NEW";
        }
      }

      const slaBreached = (fulfillmentStatus === "NEW" || fulfillmentStatus === "PACKED") && isOlderThan24h;

      if (fulfillmentStatus === "NEW") last24New++;
      else if (fulfillmentStatus === "PACKED") last24Packed++;
      else if (fulfillmentStatus === "IN_TRANSIT") last24InTransit++;
      else if (fulfillmentStatus === "OUT_FOR_DELIVERY") last24OutForDelivery++;
      else if (fulfillmentStatus === "DELIVERED") last24Delivered++;
      else if (fulfillmentStatus === "ISSUE") last24Issues++;

      if (slaBreached) last24SlaBreached++;

      const isCod = order.paymentMethod?.toLowerCase() === "cod";
      if (isCod) last24Cod++;
      else last24Prepaid++;

      const carrierName = shipment?.provider || shipment?.courierName || (fulfillmentStatus === "NEW" ? "Unassigned" : "Standard Courier");
      carrierBreakdown[carrierName] = (carrierBreakdown[carrierName] || 0) + 1;
    }

    // 2. Build filtered and paginated query for the Orders table
    const andConditions: any[] = [];

    // Search filter across Order Number, Customer details, AWB, Items, and Users
    if (options.search && options.search.trim()) {
      const cleanTerm = options.search.trim();
      const strippedOrderNum = cleanTerm.replace(/^#/, "").trim();
      const escapedTerm = cleanTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const escapedOrderNum = strippedOrderNum.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const digitsOnly = cleanTerm.replace(/[^0-9]/g, "");

      // Match shipments (AWB, Courier Name)
      const matchingShipments = await ShipmentModel.find({
        $or: [
          { awb: { $regex: escapedTerm, $options: "i" } },
          { courierName: { $regex: escapedTerm, $options: "i" } }
        ]
      }).select("orderId").lean().exec();

      const shipmentOrderIds = matchingShipments.map((s) => s.orderId).filter(Boolean);

      // Match registered users (firstName, lastName, full name, email, phone)
      let userOrderIds: string[] = [];
      try {
        const { UserModel } = await import("../user/user.model");
        const userOrConditions: any[] = [
          { email: { $regex: escapedTerm, $options: "i" } },
          { firstName: { $regex: escapedTerm, $options: "i" } },
          { lastName: { $regex: escapedTerm, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ["$firstName", " ", "$lastName"] },
                regex: escapedTerm,
                options: "i"
              }
            }
          }
        ];
        if (digitsOnly.length >= 4) {
          userOrConditions.push({ phone: { $regex: digitsOnly, $options: "i" } });
        }
        const matchingUsers = await UserModel.find({ $or: userOrConditions }).select("_id").lean().exec();
        userOrderIds = matchingUsers.map((u) => String(u._id));
      } catch {
        // Continue if user model lookup fails
      }

      const searchOr: any[] = [
        { orderNumber: { $regex: escapedOrderNum, $options: "i" } },
        { "shippingAddress.fullName": { $regex: escapedTerm, $options: "i" } },
        { "shippingAddress.phone": { $regex: escapedTerm, $options: "i" } },
        { "shippingAddress.city": { $regex: escapedTerm, $options: "i" } },
        { "shippingAddress.state": { $regex: escapedTerm, $options: "i" } },
        { "shippingAddress.pincode": { $regex: escapedTerm, $options: "i" } },
        { guestEmail: { $regex: escapedTerm, $options: "i" } },
        { "items.name": { $regex: escapedTerm, $options: "i" } },
        { "items.sku": { $regex: escapedTerm, $options: "i" } },
      ];

      // Multi-word full name matching across words
      const words = cleanTerm.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        const wordRegexes = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
        searchOr.push({
          $and: wordRegexes.map(w => ({ "shippingAddress.fullName": { $regex: w, $options: "i" } }))
        });
      }

      if (digitsOnly.length >= 4) {
        searchOr.push({ "shippingAddress.phone": { $regex: digitsOnly, $options: "i" } });
      }

      if (shipmentOrderIds.length > 0) {
        searchOr.push({ _id: { $in: shipmentOrderIds } });
        searchOr.push({ orderNumber: { $in: shipmentOrderIds } });
      }

      if (userOrderIds.length > 0) {
        searchOr.push({ userId: { $in: userOrderIds } });
      }

      andConditions.push({ $or: searchOr });
    }

    // Status filter mapping (combined with search using $and)
    if (options.status && options.status !== "ALL") {
      const filterSt = options.status.toUpperCase();
      if (filterSt === "NEW") {
        andConditions.push({ status: { $in: ["confirmed", "processing", "pending_payment"] } });
      } else if (filterSt === "PACKED") {
        const packedShipments = await ShipmentModel.find({
          status: { $in: ["READY_TO_SHIP", "AWB_ASSIGNED", "SHIPMENT_CREATED"] }
        }).select("orderId").lean().exec();
        const packedIds = packedShipments.map((s) => s.orderId);
        andConditions.push({
          $or: [
            { status: "packed" },
            ...(packedIds.length > 0 ? [{ _id: { $in: packedIds } }] : [])
          ]
        });
      } else if (filterSt === "IN_TRANSIT") {
        const transitShipments = await ShipmentModel.find({
          status: { $in: ["PICKED_UP", "IN_TRANSIT"] }
        }).select("orderId").lean().exec();
        const transitIds = transitShipments.map((s) => s.orderId);
        andConditions.push({
          $or: [
            { status: "shipped" },
            ...(transitIds.length > 0 ? [{ _id: { $in: transitIds } }] : [])
          ]
        });
      } else if (filterSt === "OUT_FOR_DELIVERY") {
        const ofdShipments = await ShipmentModel.find({
          status: "OUT_FOR_DELIVERY"
        }).select("orderId").lean().exec();
        const ofdIds = ofdShipments.map((s) => s.orderId);
        andConditions.push({ _id: { $in: ofdIds } });
      } else if (filterSt === "DELIVERED") {
        andConditions.push({ status: "delivered" });
      } else if (filterSt === "ISSUE") {
        const issueShipments = await ShipmentModel.find({
          status: { $in: ["NDR", "RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED", "FAILED", "LOST", "DAMAGED"] }
        }).select("orderId").lean().exec();
        const issueIds = issueShipments.map((s) => s.orderId);
        andConditions.push({
          $or: [
            { status: { $in: ["return_requested", "failed", "cancelled"] } },
            ...(issueIds.length > 0 ? [{ _id: { $in: issueIds } }] : [])
          ]
        });
      }
    }

    const orderQuery = andConditions.length === 1 
      ? andConditions[0] 
      : andConditions.length > 1 
      ? { $and: andConditions } 
      : {};

    // Execute paginated order query with lightweight projection
    const [paginatedOrders, totalMatchingOrders] = await Promise.all([
      OrderModel.find(orderQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("orderNumber createdAt status shippingAddress paymentMethod pricing items")
        .lean()
        .exec(),
      OrderModel.countDocuments(orderQuery)
    ]);

    const pageOrderIds = paginatedOrders.map((o) => String(o._id));
    const pageShipments = pageOrderIds.length > 0
      ? await ShipmentModel.find({ orderId: { $in: pageOrderIds } })
          .select("orderId awb provider courierName status trackingUrl labelUrl pickupScheduledDate createdAt updatedAt")
          .lean()
          .exec()
      : [];

    const pageShipmentMap = new Map<string, any>();
    for (const sh of pageShipments) {
      pageShipmentMap.set(String(sh.orderId), sh);
    }

    const formattedOrders = paginatedOrders.map((order: any) => {
      const shipment = pageShipmentMap.get(String(order._id));
      const orderCreatedAt = order.createdAt ? new Date(order.createdAt).getTime() : now;
      const isOlderThan24h = (now - orderCreatedAt) > twentyFourHoursMs;

      let fulfillmentStatus: "NEW" | "PACKED" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "ISSUE" = "NEW";

      if (shipment) {
        const shStatus = (shipment.status || "").toUpperCase();
        if (shStatus === "DELIVERED") {
          fulfillmentStatus = "DELIVERED";
        } else if (shStatus === "OUT_FOR_DELIVERY") {
          fulfillmentStatus = "OUT_FOR_DELIVERY";
        } else if (["PICKED_UP", "IN_TRANSIT"].includes(shStatus)) {
          fulfillmentStatus = "IN_TRANSIT";
        } else if (["READY_TO_SHIP", "AWB_ASSIGNED", "SHIPMENT_CREATED"].includes(shStatus)) {
          fulfillmentStatus = "PACKED";
        } else if (["NDR", "RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED", "FAILED", "LOST", "DAMAGED"].includes(shStatus)) {
          fulfillmentStatus = "ISSUE";
        }
      } else {
        const ordStatus = (order.status || "").toLowerCase();
        if (ordStatus === "delivered") {
          fulfillmentStatus = "DELIVERED";
        } else if (ordStatus === "shipped") {
          fulfillmentStatus = "IN_TRANSIT";
        } else if (ordStatus === "packed") {
          fulfillmentStatus = "PACKED";
        } else if (["return_requested", "failed", "cancelled"].includes(ordStatus)) {
          fulfillmentStatus = "ISSUE";
        } else {
          fulfillmentStatus = "NEW";
        }
      }

      const slaBreached = (fulfillmentStatus === "NEW" || fulfillmentStatus === "PACKED") && isOlderThan24h;
      const isCod = order.paymentMethod?.toLowerCase() === "cod";
      const itemsCount = (order.items || []).reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

      return {
        id: String(order._id),
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customer: {
          fullName: order.shippingAddress?.fullName || "Valued Rider",
          phone: order.shippingAddress?.phone || "",
          addressLine1: order.shippingAddress?.addressLine1 || (order.shippingAddress as any)?.street || "",
          addressLine2: order.shippingAddress?.addressLine2 || "",
          city: order.shippingAddress?.city || "",
          state: order.shippingAddress?.state || "",
          pincode: order.shippingAddress?.pincode || "",
          country: order.shippingAddress?.country || "India",
        },
        paymentMethod: isCod ? "cod" : "prepaid",
        codAmountToCollect: isCod ? (order.pricing?.codAmountToCollect || order.pricing?.total || 0) : 0,
        totalAmount: order.pricing?.total || 0,
        pricing: order.pricing ? {
          subtotal: order.pricing.subtotal || 0,
          discount: order.pricing.discount || 0,
          couponCode: order.pricing.couponCode || undefined,
          couponDiscount: order.pricing.couponDiscount || 0,
          shipping: order.pricing.shipping || 0,
          tax: order.pricing.tax || 0,
          taxRate: order.pricing.taxRate || 0,
          total: order.pricing.total || 0,
          codAmountToCollect: order.pricing.codAmountToCollect || 0,
        } : {
          subtotal: 0,
          discount: 0,
          couponDiscount: 0,
          shipping: 0,
          tax: 0,
          taxRate: 0,
          total: 0,
          codAmountToCollect: 0,
        },
        orderStatus: order.status,
        fulfillmentStatus,
        slaBreached,
        itemsCount,
        items: (order.items || []).map((i: any) => ({
          name: i.name,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: typeof i.unitPrice === "number" ? i.unitPrice : (typeof i.price === "number" ? i.price : 0),
          taxRate: i.taxRate || 0,
          taxAmount: i.taxAmount || 0,
          image: i.image || "",
          variantId: i.variantId || "",
          productId: i.productId || "",
          slug: i.slug || "",
        })),
        shipment: shipment ? {
          id: String(shipment._id),
          awb: shipment.awb,
          provider: shipment.provider,
          courierName: shipment.courierName,
          status: shipment.status,
          trackingUrl: shipment.trackingUrl,
          labelUrl: shipment.labelUrl,
          pickupScheduledDate: shipment.pickupScheduledDate,
          createdAt: (shipment as any).createdAt ? new Date((shipment as any).createdAt).toISOString() : undefined,
          updatedAt: (shipment as any).updatedAt ? new Date((shipment as any).updatedAt).toISOString() : undefined,
        } : null,
      };
    });

    // 3. Global Warehouse Operational Counts across entire database (Cached with 20s TTL)
    const pipelineCacheKey = "admin_logistics_pipeline_totals";
    let pipelineCounts = await getCache(pipelineCacheKey);

    if (!pipelineCounts) {
      const [
        pendingPackingTotal,
        packedReadyTotal,
        inTransitTotal,
        outForDeliveryTotal,
        deliveredTodayTotal,
        exceptionsTotal
      ] = await Promise.all([
        OrderModel.countDocuments({ status: { $in: ["confirmed", "processing", "pending_payment"] } }),
        ShipmentModel.countDocuments({ status: { $in: ["READY_TO_SHIP", "AWB_ASSIGNED", "SHIPMENT_CREATED"] } }),
        ShipmentModel.countDocuments({ status: { $in: ["PICKED_UP", "IN_TRANSIT"] } }),
        ShipmentModel.countDocuments({ status: "OUT_FOR_DELIVERY" }),
        ShipmentModel.countDocuments({ 
          status: "DELIVERED", 
          updatedAt: { $gte: startOfToday } 
        }),
        ShipmentModel.countDocuments({ 
          status: { $in: ["NDR", "RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED", "FAILED", "LOST", "DAMAGED"] } 
        })
      ]);

      pipelineCounts = {
        pendingPackingTotal,
        packedReadyTotal,
        inTransitTotal,
        outForDeliveryTotal,
        deliveredTodayTotal,
        exceptionsTotal
      };
      await setCache(pipelineCacheKey, pipelineCounts, 20); // 20s TTL
    }

    return {
      last24Summary: {
        totalOrders: last24Orders.length,
        newOrders: last24New,
        packedOrders: last24Packed,
        inTransit: last24InTransit,
        outForDelivery: last24OutForDelivery,
        delivered: last24Delivered,
        issues: last24Issues,
        slaBreached: last24SlaBreached,
        paymentSplit: {
          cod: last24Cod,
          prepaid: last24Prepaid
        },
        carrierBreakdown
      },
      overallPipeline: pipelineCounts,
      pagination: {
        totalCount: totalMatchingOrders,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(totalMatchingOrders / limit))
      },
      orders: formattedOrders
    };
  }

  static async getRecentOrders() {
    return await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("orderNumber createdAt status shippingAddress paymentMethod pricing items")
      .lean()
      .exec();
  }

  static async getRevenueChart() {
    const cacheKey = "admin_revenue_chart_30d";
    const cachedChart = await getCache(cacheKey);
    if (cachedChart) {
      return cachedChart;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$pricing.total" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const result = data.map(item => ({
      date: item._id,
      revenue: item.revenue
    }));

    await setCache(cacheKey, result, 300); // 5 min TTL
    return result;
  }

  static async getTestProduct() {
    const product = await ProductModel.findOne({ sku: "TEST-SANDBOX-001" }).lean().exec();
    return { exists: !!product, product };
  }

  static async createTestProduct() {
    const testData = {
      name: "Store4Riders Sandbox Test Item (₹1)",
      slug: "store4riders-test-product",
      sku: "TEST-SANDBOX-001",
      basePrice: 1,
      specialPrice: 1,
      stockStatus: 1,
      productType: "simple",
      description: "<p>This is a temporary sandbox product created for testing payment gateways (PayU, CCAvenue, Snapmint) and order checkout flows. You can safely purchase this for ₹1 in test mode and delete it from the Admin panel anytime.</p>",
      shortDescription: "Temporary sandbox test product for payment and checkout verification.",
      images: [
        {
          id: "test-img-1",
          url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
          altText: "Store4Riders Test Product"
        }
      ],
      variants: [
        {
          id: "var-test-1",
          sku: "TEST-SANDBOX-001-STD",
          price: 1,
          stock: 999,
          attributes: new Map([["size", "Standard"], ["color", "Red"]])
        }
      ],
      status: "published",
      isFeatured: false,
      salesCount: 0
    };

    const product = await ProductModel.findOneAndUpdate(
      { sku: "TEST-SANDBOX-001" },
      { $set: testData },
      { new: true, upsert: true }
    ).lean().exec();

    if (product) {
      await indexProduct(product);
    }

    return product;
  }

  static async deleteTestProduct() {
    const product = await ProductModel.findOne({ sku: "TEST-SANDBOX-001" }).lean().exec();
    if (product) {
      await removeProductFromIndex((product as any)._id.toString());
    }

    await ProductModel.deleteMany({
      $or: [{ sku: "TEST-SANDBOX-001" }, { slug: "store4riders-test-product" }]
    }).exec();
    return { success: true };
  }
}
