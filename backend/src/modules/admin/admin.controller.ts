import { NextRequest, NextResponse } from "next/server";
import { AdminValidator } from "./admin.validator";
import { UserService } from "../user/user.service";
import { AdminService } from "./admin.service";
import { ApiResponse } from "../../core/response/ApiResponse";
import { UnauthorizedError, ForbiddenError } from "../../core/errors/AppError";

export class AdminController {
  static async getUsers(req: NextRequest) {
    const { page, limit, role, search } = AdminValidator.validatePagination(req);
    const { items, totalCount } = await UserService.getUsers(page, limit, role, search);
    return ApiResponse.paginated(items, totalCount, page, limit);
  }

  static async createStaffUser(req: NextRequest, requestingUserId: string) {
    const body = await req.json();
    const data = AdminValidator.validateCreateStaffUser(body);
    const user = await UserService.createStaffUser(data as any, requestingUserId);
    return ApiResponse.success(user, "Staff user created successfully", 201);
  }

  static async updateRole(req: NextRequest, userId: string, requestingUserId?: string) {
    const body = await req.json();
    const { role } = AdminValidator.validateRoleUpdate(body);
    const user = await UserService.updateRole(userId, role, requestingUserId);
    return ApiResponse.success(user, "User role updated successfully");
  }

  static async updateStatus(req: NextRequest, userId: string, requestingUserId?: string) {
    const body = await req.json();
    const { isActive } = AdminValidator.validateStatusUpdate(body);
    const user = await UserService.updateStatus(userId, isActive, requestingUserId);
    return ApiResponse.success(user, "User status updated successfully");
  }

  static async deleteUser(req: NextRequest, userId: string, requestingUserId: string) {
    await UserService.deleteUser(userId, requestingUserId);
    return ApiResponse.success(null, "User deleted successfully");
  }

  static async getDashboardStats(req: NextRequest, requestingUserId?: string) {
    let role: string | undefined;
    if (requestingUserId) {
      role = await UserService.getRole(requestingUserId);
    }
    const stats = await AdminService.getDashboardStats(role);
    return ApiResponse.success(stats, "Dashboard stats fetched successfully");
  }

  static async getLogisticsDashboardStats(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    const stats = await AdminService.getLogisticsDashboardStats({ page, limit, status, search });
    return ApiResponse.success(stats, "Logistics dashboard stats fetched successfully");
  }

  static async getRecentOrders(req: NextRequest) {
    const orders = await AdminService.getRecentOrders();
    return ApiResponse.success(orders, "Recent orders fetched successfully");
  }

  static async getRevenueChart(req: NextRequest, requestingUserId?: string) {
    if (requestingUserId) {
      const role = await UserService.getRole(requestingUserId);
      if (role === "logistic") {
        return ApiResponse.success([], "Revenue chart not available for logistic role");
      }
    }
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

  static async getTestProduct(req: NextRequest) {
    const data = await AdminService.getTestProduct();
    return ApiResponse.success(data, "Test product status retrieved");
  }

  static async createTestProduct(req: NextRequest) {
    const product = await AdminService.createTestProduct();
    return ApiResponse.success(product, "Test product created successfully");
  }

  static async deleteTestProduct(req: NextRequest) {
    await AdminService.deleteTestProduct();
    return ApiResponse.success(null, "Test product removed successfully");
  }

  /**
   * Enterprise Real-Time Server-Sent Events (SSE) Stream
   * Pushes instant notifications for new orders, status changes, and shipments.
   * Eliminates aggressive polling while keeping idle DB queries at ZERO.
   */
  static async getLiveStream(req: NextRequest) {
    let token = req.headers.get("authorization")?.startsWith("Bearer ")
      ? req.headers.get("authorization")?.split(" ")[1]
      : req.cookies.get("accessToken")?.value || req.nextUrl.searchParams.get("token");

    if (!token) {
      throw new UnauthorizedError("Authentication required for live stream");
    }

    const { verifyToken } = await import("../../core/utils/jwt");
    const decoded = verifyToken(token);
    const role = await UserService.getRole(decoded.userId);
    if (!["admin", "superadmin", "manager", "staff", "logistic"].includes(role)) {
      throw new ForbiddenError("Insufficient permissions to access admin live stream");
    }

    const { adminEventHub } = await import("../../core/events/adminEventHub");
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const initial = `event: connected\ndata: ${JSON.stringify({ connected: true, timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(initial));

        const unsubscribe = adminEventHub.subscribe((event) => {
          try {
            const chunk = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          } catch {
            // Stream closed
          }
        });

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(heartbeat);
          }
        }, 20000);

        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          unsubscribe();
          try {
            controller.close();
          } catch {}
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }
}
