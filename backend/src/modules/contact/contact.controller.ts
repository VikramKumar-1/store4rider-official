import { NextRequest } from "next/server";
import { ContactValidator } from "./contact.validator";
import { ContactService } from "./contact.service";
import { ApiResponse } from "../../core/response/ApiResponse";
import { UserService } from "../user/user.service";
import { ForbiddenError } from "../../core/errors/AppError";

const ALLOWED_STAFF_ROLES = [
  "super_admin",
  "admin",
  "customer_care",
  "customer_support",
  "order_manager",
];

export class ContactController {
  private static async assertStaffAccess(req: NextRequest) {
    const userId = ContactValidator.extractUserId(req);
    const role = await UserService.getRole(userId);
    if (!ALLOWED_STAFF_ROLES.includes(role)) {
      throw new ForbiddenError("Staff access required");
    }
    const user = await UserService.getProfile(userId);
    const staffName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Support Agent";
    return { userId, role, staffName: staffName || "Support Agent" };
  }

  static async submit(req: NextRequest) {
    const { data, userId } = await ContactValidator.validateSubmit(req);
    const issue = await ContactService.submitIssue(data, { userId });
    return ApiResponse.success(
      issue,
      "Your support request has been registered. Ticket ID: " + issue.ticketId,
      201
    );
  }

  static async adminGetAll(req: NextRequest) {
    await ContactController.assertStaffAccess(req);
    const query = ContactValidator.validateAdminQuery(req);
    const result = await ContactService.getAllIssues(query, query.page, query.limit);
    return ApiResponse.paginated(result.items, result.total, query.page, query.limit);
  }

  static async adminGetStats(req: NextRequest) {
    await ContactController.assertStaffAccess(req);
    const stats = await ContactService.getStats();
    return ApiResponse.success(stats, "Contact inquiry stats fetched successfully");
  }

  static async adminGetById(req: NextRequest, id: string) {
    await ContactController.assertStaffAccess(req);
    const issue = await ContactService.getIssueById(id);
    return ApiResponse.success(issue, "Contact inquiry fetched successfully");
  }

  static async adminUpdateStatus(req: NextRequest, id: string) {
    const { staffName } = await ContactController.assertStaffAccess(req);
    const data = await ContactValidator.validateUpdateStatus(req);
    const updated = await ContactService.updateStatus(id, data, staffName);
    return ApiResponse.success(updated, "Inquiry status updated successfully");
  }

  static async adminAddNote(req: NextRequest, id: string) {
    const { staffName } = await ContactController.assertStaffAccess(req);
    const data = await ContactValidator.validateAddNote(req);
    const updated = await ContactService.addNote(id, data.text, staffName);
    return ApiResponse.success(updated, "Internal note added successfully");
  }
}
