import crypto from "crypto";
import { ContactRepository } from "./contact.repository";
import {
  CreateContactIssueInput,
  UpdateContactIssueStatusInput,
} from "@store4riders/shared-validation";
import { ContactIssueStatus, IContactIssue } from "@store4riders/shared-types";
import { NotFoundError, ValidationError } from "../../core/errors/AppError";
import { logger } from "../../core/utils/logger";
import { addEmailJob } from "../../core/queue/email.queue";
import { SettingRepository } from "../settings/setting.repository";
import { OrderModel } from "../order/order.model";

export class ContactService {
  private static generateTicketId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `TKT-${dateStr}-${randomHex}`;
  }

  static async submitIssue(
    input: CreateContactIssueInput,
    userContext?: { userId?: string }
  ): Promise<IContactIssue> {
    const ticketId = this.generateTicketId();

    let orderId: string | undefined = undefined;
    let cleanOrderNum = input.orderNumber?.trim();

    if (cleanOrderNum) {
      cleanOrderNum = cleanOrderNum.replace(/^#/, "");
      try {
        const order: any = await OrderModel.findOne({
          $or: [
            { orderNumber: { $regex: `^${cleanOrderNum}$`, $options: "i" } },
            { _id: cleanOrderNum.match(/^[0-9a-fA-F]{24}$/) ? cleanOrderNum : undefined },
          ].filter(Boolean) as any,
        })
          .select("_id")
          .lean()
          .exec();

        if (order) {
          orderId = String(order._id);
        }
      } catch (err) {
        logger.warn(`Could not link order ${cleanOrderNum} to ticket:`, err);
      }
    }

    const newIssue = await ContactRepository.create({
      ticketId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim(),
      orderNumber: cleanOrderNum,
      orderId,
      userId: userContext?.userId,
      category: input.category,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: "open",
      priority: input.category === "payment_issue" || input.category === "return_exchange" ? "high" : "medium",
      notes: [],
    });

    // Notify customer asynchronously via email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #AB1509; margin-top: 0;">Store4Riders Support Request Received</h2>
          <p>Hi <strong>${input.name}</strong>,</p>
          <p>Thank you for reaching out to Store4Riders Customer Care. We have logged your request with reference:</p>
          <div style="background-color: #f7f7f7; padding: 12px 16px; border-left: 4px solid #AB1509; margin: 16px 0;">
            <p style="margin: 0; font-size: 16px; font-weight: bold;">Ticket ID: ${ticketId}</p>
            <p style="margin: 4px 0 0 0; color: #555;">Subject: ${input.subject}</p>
            ${cleanOrderNum ? `<p style="margin: 4px 0 0 0; color: #555;">Related Order: #${cleanOrderNum}</p>` : ""}
          </div>
          <p>Our customer care representatives are reviewing your issue and will get back to you shortly via phone or email.</p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">This is an automated confirmation from Store4Riders Support.</p>
        </div>
      `;
      await addEmailJob(input.email.trim(), `Support Request Received: ${ticketId}`, emailHtml);

      // Also notify staff
      const settings = await SettingRepository.getSettings();
      const supportEmail = settings?.supportEmail || "contact@store4riders.com";
      const staffHtml = `
        <div style="font-family: Arial, sans-serif; padding: 15px;">
          <h3>New Customer Inquiry (${ticketId})</h3>
          <p><strong>Customer:</strong> ${input.name} (${input.email}, ${input.phone || "No phone"})</p>
          <p><strong>Category:</strong> ${input.category}</p>
          <p><strong>Subject:</strong> ${input.subject}</p>
          ${cleanOrderNum ? `<p><strong>Order #:</strong> ${cleanOrderNum}</p>` : ""}
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f4f4f4; padding: 10px; border-left: 3px solid #ccc;">${input.message}</blockquote>
        </div>
      `;
      await addEmailJob(supportEmail, `[New Ticket] ${ticketId} - ${input.subject}`, staffHtml);
    } catch (emailErr) {
      logger.error("Failed to queue contact notification email", emailErr);
    }

    return {
      ...newIssue,
      id: String((newIssue as any)._id || newIssue.id),
    } as unknown as IContactIssue;
  }

  static async getAllIssues(query: any, page: number = 1, limit: number = 20) {
    const dbQuery: any = {};

    if (query.status && query.status !== "all") {
      dbQuery.status = query.status;
    }

    if (query.category && query.category !== "all") {
      dbQuery.category = query.category;
    }

    if (query.search && query.search.trim()) {
      const search = query.search.trim();
      const escaped = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const digits = search.replace(/[^0-9]/g, "");

      const orConditions: any[] = [
        { ticketId: { $regex: escaped, $options: "i" } },
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { orderNumber: { $regex: escaped, $options: "i" } },
        { subject: { $regex: escaped, $options: "i" } },
        { message: { $regex: escaped, $options: "i" } },
      ];

      if (digits.length >= 4) {
        orConditions.push({ phone: { $regex: digits, $options: "i" } });
      }

      dbQuery.$or = orConditions;
    }

    return await ContactRepository.findPaginated(dbQuery, page, limit);
  }

  static async getIssueById(id: string) {
    const issue: any = await ContactRepository.findById(id);
    if (!issue) {
      throw new NotFoundError("Contact inquiry not found");
    }
    return {
      ...issue,
      id: String(issue._id || issue.id),
    };
  }

  static async updateStatus(
    id: string,
    input: UpdateContactIssueStatusInput,
    author: string = "Staff"
  ) {
    const updated = await ContactRepository.updateStatus(
      id,
      input.status as ContactIssueStatus,
      input.note,
      author
    );
    if (!updated) {
      throw new NotFoundError("Contact inquiry not found");
    }
    return updated;
  }

  static async addNote(id: string, text: string, author: string = "Staff") {
    if (!text || !text.trim()) {
      throw new ValidationError("Note text is required");
    }
    const updated = await ContactRepository.addNote(id, text.trim(), author);
    if (!updated) {
      throw new NotFoundError("Contact inquiry not found");
    }
    return updated;
  }

  static async getStats() {
    return await ContactRepository.getStats();
  }
}
