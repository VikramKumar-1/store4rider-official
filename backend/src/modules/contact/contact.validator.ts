import { NextRequest } from "next/server";
import {
  createContactIssueSchema,
  updateContactIssueStatusSchema,
  addContactIssueNoteSchema,
} from "@store4riders/shared-validation";
import { ValidationError, AppError } from "../../core/errors/AppError";
import { extractUserFromAuth } from "../../core/middlewares/auth";

export class ContactValidator {
  static async validateSubmit(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }

    const result = createContactIssueSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(
        result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    let userId: string | undefined = undefined;
    try {
      userId = extractUserFromAuth(req);
    } catch {
      // Optional for guest contact forms
    }

    return { data: result.data, userId };
  }

  static validateAdminQuery(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    return { page, limit, status, category, search };
  }

  static async validateUpdateStatus(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }

    const result = updateContactIssueStatusSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(
        result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    return result.data;
  }

  static async validateAddNote(req: NextRequest) {
    let body;
    try {
      body = await req.json();
    } catch {
      throw new AppError("Invalid JSON", 400);
    }

    const result = addContactIssueNoteSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(
        result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      );
    }

    return result.data;
  }

  static extractUserId(req: NextRequest): string {
    return extractUserFromAuth(req);
  }
}
