import { z } from "zod";

export const createReturnSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      variantId: z.string().optional(),
      quantity: z.number().int().positive(),
      reason: z.string().min(10, "Please provide a detailed reason for return"),
    })
  ).min(1, "At least one item must be returned"),
  refundMethod: z.enum(["original_source", "upi", "bank_transfer", "wallet"]),
  
  // Conditionally required fields based on refund method
  upiId: z.string().optional(),
  bankDetails: z.object({
    accountNumber: z.string(),
    ifsc: z.string(),
    accountHolderName: z.string()
  }).optional()
}).superRefine((data, ctx) => {
  if (data.refundMethod === "upi" && !data.upiId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "UPI ID is required when refund method is UPI",
      path: ["upiId"]
    });
  }
  if (data.refundMethod === "bank_transfer" && !data.bankDetails?.accountNumber) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Bank details are required when refund method is Bank Transfer",
      path: ["bankDetails"]
    });
  }
});

export const qcInwardSchema = z.object({
  action: z.enum(["approve_full", "approve_partial", "reject", "courier_dispute"]),
  qcNotes: z.string().min(1, "QC Notes are required").optional(),
  customRefundAmount: z.number().min(0).optional(),
}).superRefine((data, ctx) => {
  if (data.action === "approve_partial" && (data.customRefundAmount === undefined || data.customRefundAmount < 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please enter the exact amount you want to refund to the customer",
      path: ["customRefundAmount"]
    });
  }
  if ((data.action === "reject" || data.action === "approve_partial") && !data.qcNotes) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please provide QC notes explaining the reason",
      path: ["qcNotes"]
    });
  }
});
