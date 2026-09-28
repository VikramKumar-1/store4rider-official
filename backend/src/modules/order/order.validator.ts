import { NextRequest } from "next/server";
import { createOrderSchema, verifyPaymentSchema } from "@store4riders/shared-validation";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * OrderValidator
 * 
 * Handles extracting JSON payloads from incoming order requests
 * and strictly validating them against Zod schemas.
 */
export class OrderValidator {
  
  /**
   * Validates the payload for creating a new order.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<{userId: string, data: any}>} The user ID and validated order data.
   */
  static async validateCreate(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = createOrderSchema.parse(body);
    return { userId, data };
  }

  /**
   * Validates the payload for verifying a gateway payment.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {Promise<{userId: string, data: any}>} The user ID and validated payment data.
   */
  static async validateVerify(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = verifyPaymentSchema.parse(body);
    return { userId, data };
  }

  /**
   * Extracts the authenticated user's ID.
   * 
   * @param {NextRequest} req - The incoming HTTP request.
   * @returns {string} The authenticated user's ID.
   */
  static extractUserId(req: NextRequest) {
    return extractUserFromAuth(req);
  }

  static async validateAdminUpdateStatus(req: NextRequest) {
    const { z } = require("zod");
    const schema = z.object({
      status: z.enum([
        "pending_payment", "confirmed", "processing", "packed", "shipped", 
        "delivered", "cancelled", "failed", "refunded", 
        "return_requested", "return_approved", "return_picked", "returned"
      ])
    });
    const body = await req.json();
    return schema.parse(body);
  }

  static async validateAdminAddNote(req: NextRequest) {
    const { z } = require("zod");
    const schema = z.object({
      text: z.string().min(1, "Note text is required").max(1000)
    });
    const body = await req.json();
    return schema.parse(body);
  }

  static validateAdminGetQuery(req: NextRequest) {
    const { z } = require("zod");
    const searchParams = req.nextUrl.searchParams;
    const schema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      status: z.string().optional(),
      paymentMethod: z.string().optional(),
      search: z.string().optional(),
      userId: z.string().optional(),
    });
    
    return schema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      search: searchParams.get("search") || undefined,
      userId: searchParams.get("userId") || undefined,
    });
  }

  static async validateRequestReturn(req: NextRequest) {
    const { z } = require("zod");
    const schema = z.object({
      reason: z.string().min(1, "Reason is required"),
      images: z.array(z.string()).optional()
    });
    const body = await req.json();
    return schema.parse(body);
  }

  static async validateAdminHandleReturn(req: NextRequest) {
    const { z } = require("zod");
    const schema = z.object({
      action: z.enum(["approve", "reject"]),
      adminNote: z.string().optional()
    });
    const body = await req.json();
    return schema.parse(body);
  }
}
