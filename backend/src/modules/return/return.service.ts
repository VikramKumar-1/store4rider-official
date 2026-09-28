import mongoose from "mongoose";
import { AppError } from "../../core/errors/AppError";
import { ReturnRepository } from "./return.repository";
import { IReturn } from "./return.model";
import { logger } from "../../core/utils/logger";
import { PayuPayoutProvider } from "../../core/payout/PayuPayoutProvider";

export class ReturnService {
  
  /**
   * Called by the Customer from the Frontend to initiate a Return.
   */
  static async createReturnRequest(data: any): Promise<IReturn> {
    const { OrderRepository } = require("../order/order.repository");
    const order = await OrderRepository.findById(data.orderId);
    
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    
    // In a fully robust system, you calculate the refundAmount based on the specific items 
    // being returned (e.g. Item Price * Quantity - Discounts).
    // For now, assuming full order amount if all items returned, or client sends expected amount.
    const expectedRefund = order.pricing.finalTotal; 

    const returnDoc = await ReturnRepository.create({
      orderId: data.orderId,
      userId: order.userId,
      status: "requested",
      items: data.items,
      refundMethod: data.refundMethod,
      refundAmount: expectedRefund,
      upiId: data.upiId,
      bankDetails: data.bankDetails
    });

    logger.info(`[RETURN RAISED] Customer requested return for Order ${data.orderId}`);
    return returnDoc;
  }

  /**
   * Called by the Warehouse staff using a Barcode Scanner
   * This is "Step 2" of the Two-Step inwarding process. Starts the SLA timer.
   */
  static async inwardScanQC(returnId: string): Promise<IReturn> {
    const returnDoc = await ReturnRepository.findById(returnId);
    if (!returnDoc) throw new AppError("Return request not found", 404);

    if (returnDoc.status === "inwarded_for_qc") {
      throw new AppError("Package has already been inwarded for QC", 400);
    }
    
    // Even if it didn't have "reached_facility" (webhook failed), an inward scan overrides everything
    returnDoc.status = "inwarded_for_qc";
    returnDoc.inwardedAt = new Date();
    await returnDoc.save();

    logger.info(`[RETURN QC] Package for return ${returnId} inwarded. 48-hour SLA timer started.`);
    return returnDoc;
  }

  /**
   * Called by Admin when performing physical QC of the product
   */
  static async processQCResult(
    returnId: string, 
    action: "approve_full" | "approve_partial" | "reject" | "courier_dispute",
    qcNotes?: string,
    customRefundAmount?: number
  ): Promise<IReturn> {
    const returnDoc = await ReturnRepository.findById(returnId);
    if (!returnDoc) throw new AppError("Return request not found", 404);

    if (returnDoc.status !== "inwarded_for_qc") {
      throw new AppError(`Cannot perform QC. Current status is ${returnDoc.status}`, 400);
    }

    returnDoc.qcCompletedAt = new Date();
    returnDoc.qcNotes = qcNotes;

    switch (action) {
      case "reject":
        // Customer Fraud / Swapped Item
        returnDoc.status = "qc_failed";
        logger.info(`[RETURN QC] Return ${returnId} rejected. No refund will be issued.`);
        break;

      case "courier_dispute":
        // Courier broke it. Refund customer, but mark dispute to claim from Courier
        returnDoc.status = "refunded";
        returnDoc.actualRefundedAmount = returnDoc.refundAmount;
        returnDoc.courierDispute = true;
        returnDoc.disputeStatus = "pending";
        await this.executeRefund(returnDoc);
        break;

      case "approve_partial":
        // Admin manually entered the final amount to refund
        returnDoc.status = "partially_refunded";
        returnDoc.actualRefundedAmount = customRefundAmount;
        await this.executeRefund(returnDoc);
        break;

      case "approve_full":
        // Perfect condition
        returnDoc.status = "refunded";
        returnDoc.actualRefundedAmount = returnDoc.refundAmount;
        await this.executeRefund(returnDoc);
        break;
    }

    await returnDoc.save();
    return returnDoc;
  }

  /**
   * Internal helper to trigger PayU Refunds or PayU Payouts based on original payment
   */
  private static async executeRefund(returnDoc: IReturn) {
    logger.info(`[REFUND INITIATED] Processing refund of ₹${returnDoc.actualRefundedAmount} for Return ${returnDoc.id}`);
    
    if (returnDoc.refundMethod === "original_source") {
      // This was a Prepaid Order (PayU / CCAvenue)
      // TODO: Call PayU/CCAvenue standard refund API using PaymentGatewayFactory
      logger.info(`[PREPAID REFUND] Calling Source Refund API for Order ${returnDoc.orderId}`);
    } 
    else if (returnDoc.refundMethod === "upi" || returnDoc.refundMethod === "bank_transfer") {
      // This was a COD Order. Requires Payout API
      const payoutRes = await PayuPayoutProvider.triggerPayout({
        transferId: returnDoc.id as string,
        amount: returnDoc.actualRefundedAmount || returnDoc.refundAmount,
        customerName: "Customer", // Ideally fetched from User table
        mode: returnDoc.refundMethod === "upi" ? "UPI" : "IMPS",
        upiId: returnDoc.upiId,
        bankDetails: returnDoc.bankDetails,
        purpose: "REFUND"
      });

      if (!payoutRes.success) {
        throw new AppError(`Payout Gateway Failed: ${payoutRes.message}`, 500);
      }
    }
  }

  /**
   * Run by Cron Job (e.g., Every hour) to enforce 48-Hour Auto-Refund SLA
   */
  static async processAutoRefundsSLA() {
    // Note: A robust system would calculate 'Business Hours' skipping weekends/holidays.
    // For now, we use a strict 48-hour threshold from 'inwardedAt'
    
    // Helper function to check if global setting "pause_auto_refunds" is true would go here
    // const settings = await SettingsRepository.get();
    // if (settings.pauseAutoRefunds) return;

    const pendingReturns = await ReturnRepository.findPendingAutoRefunds(48);
    
    for (const returnDoc of pendingReturns) {
      try {
        logger.info(`[SLA BREACH] Return ${returnDoc.id} exceeded 48h QC limit. Auto-approving full refund.`);
        await this.processQCResult(returnDoc.id as string, "approve_full", "Auto-approved due to SLA breach");
      } catch (err: any) {
        logger.error(`[SLA FAIL] Could not auto-refund return ${returnDoc.id}: ${err.message}`);
      }
    }
  }
}
