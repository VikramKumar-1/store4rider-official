import { OrderModel } from "../order/order.model";
import { UserModel } from "../user/user.model";
import { ProductModel } from "../product/product.model";
import { indexProduct, removeProductFromIndex } from "../../core/search/meilisearch";

export class AdminService {
  static async getDashboardStats() {
    const [totalOrders, customers, products, lowStockCount, revenueResult] = await Promise.all([
      OrderModel.countDocuments(),
      UserModel.countDocuments({ role: "customer" }),
      ProductModel.countDocuments(),
      ProductModel.countDocuments({ stockStatus: 0 }), // Or any logic for low stock
      OrderModel.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
      ])
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return {
      totalOrders,
      totalRevenue,
      customers,
      products,
      lowStockCount
    };
  }

  static async getRecentOrders() {
    return await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();
  }

  static async getRevenueChart() {
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
          revenue: { $sum: "$totalAmount" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return data.map(item => ({
      date: item._id,
      revenue: item.revenue
    }));
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
