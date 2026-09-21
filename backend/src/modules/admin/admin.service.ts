import { OrderModel } from "../order/order.model";
import { UserModel } from "../user/user.model";
import { ProductModel } from "../product/product.model";

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
}
