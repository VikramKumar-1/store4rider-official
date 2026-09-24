import { NextRequest } from "next/server";
import { AdminValidator } from "./admin.validator";
import { UserService } from "../user/user.service";
import { AdminService } from "./admin.service";
import { ApiResponse } from "../../core/response/ApiResponse";

export class AdminController {
  static async getUsers(req: NextRequest) {
    const { page, limit, role } = AdminValidator.validatePagination(req);
    const { items, totalCount } = await UserService.getUsers(page, limit, role);
    return ApiResponse.paginated(items, totalCount, page, limit);
  }

  static async updateRole(req: NextRequest, userId: string) {
    const body = await req.json();
    const { role } = AdminValidator.validateRoleUpdate(body);
    const user = await UserService.updateRole(userId, role);
    return ApiResponse.success(user, "User role updated successfully");
  }

  static async updateStatus(req: NextRequest, userId: string) {
    const body = await req.json();
    const { isActive } = AdminValidator.validateStatusUpdate(body);
    const user = await UserService.updateStatus(userId, isActive);
    return ApiResponse.success(user, "User status updated successfully");
  }

  static async getDashboardStats(req: NextRequest) {
    const stats = await AdminService.getDashboardStats();
    return ApiResponse.success(stats, "Dashboard stats fetched successfully");
  }

  static async getRecentOrders(req: NextRequest) {
    const orders = await AdminService.getRecentOrders();
    return ApiResponse.success(orders, "Recent orders fetched successfully");
  }

  static async getRevenueChart(req: NextRequest) {
    const chart = await AdminService.getRevenueChart();
    return ApiResponse.success(chart, "Revenue chart fetched successfully");
  }

  static async bulkUpdateProducts(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return ApiResponse.error("CSV file is required", 400);
    }
    const csvContent = await file.text();
    const { ProductService } = await import("../product/product.service");
    const report = await ProductService.bulkUpdateFromCsv(csvContent);
    return ApiResponse.success(report, "Bulk update processed");
  }

  static async getPaymentLogs(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const { PaymentModel } = await import("../payment/payment.model");
    
    const logs = await PaymentModel.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const totalCount = await PaymentModel.countDocuments();

    return ApiResponse.paginated(logs, totalCount, page, limit);
  }
}
