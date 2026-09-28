import { ShippingWebhookEventModel } from "../models/shipping-webhook-event.model";
import { ShippingProviderFactory } from "../../../core/shipping/ShippingProviderFactory";
import { TrackingService } from "./tracking.service";
import { logger } from "../../../core/utils/logger";

export class WebhookService {
  
  /**
   * Universal entry point for all Courier webhooks.
   * Handles Scenario #6 (Duplicate webhooks) via Idempotency.
   */
  static async processWebhook(providerName: string, payload: any, headers?: any): Promise<void> {
    
    // 1. Get the specific provider instance
    const providerInstance = ShippingProviderFactory.getProvider(providerName);
    
    // 2. Validate webhook signature/token (Security Requirement)
    if (headers) {
      const isValid = providerInstance.verifyWebhookSignature(payload, headers);
      if (!isValid) {
        logger.error(`[WebhookService] Invalid signature for provider ${providerName}`);
        throw new Error("Invalid webhook signature"); // Will return 401/403 to provider
      }
    }

    // 3. Extract unique Event ID from the payload (or generate deterministic hash if provider doesn't send one)
    // E.g., Shiprocket sends a unique ID, Delhivery might not. The provider class handles this normalization.
    const providerEventId = (providerInstance as any).extractWebhookEventId ? (providerInstance as any).extractWebhookEventId(payload) : payload?.id || Date.now().toString();

    // 4. Save to Audit Table (Idempotency Check)
    let webhookEvent;
    try {
      webhookEvent = new ShippingWebhookEventModel({
        provider: providerName,
        providerEventId: providerEventId,
        payload: payload,
        status: "PENDING"
      });
      await webhookEvent.save();
    } catch (error: any) {
      if (error.code === 11000) { // MongoDB Duplicate Key
        // Scenario #6 Handled: Do NOT throw error. Return success so provider stops retrying.
        logger.warn(`[WebhookService] Duplicate webhook event ignored: ${providerEventId}`);
        return; 
      }
      throw error;
    }

    // 5. Parse Payload into Standard Internal Format
    try {
      const normalizedEvent = (providerInstance as any).parseWebhookPayload ? (providerInstance as any).parseWebhookPayload(payload) : null;
      if (!normalizedEvent) throw new Error("parseWebhookPayload not implemented for this provider");
      
      // Update Audit Table with AWB for better debugging later
      webhookEvent.awb = normalizedEvent.awb;
      await webhookEvent.save();

      // 6. Pass to Tracking Service for FSM rules and parent updating
      await TrackingService.processTrackingEvent(normalizedEvent);
      
      // 7. Mark Audit Webhook as Successfully Processed
      webhookEvent.status = "PROCESSED";
      webhookEvent.processedAt = new Date();
      await webhookEvent.save();
      
      logger.info(`[WebhookService] Successfully processed webhook event: ${providerEventId}`);

    } catch (error: any) {
      logger.error(`[WebhookService] Failed to process webhook ${providerEventId}: ${error.message}`);
      
      // Keep record of failure so tech team can debug
      webhookEvent.status = "FAILED";
      webhookEvent.errorReason = error.message;
      await webhookEvent.save();
      
      // Optional: Depending on error type, throw error back to provider to trigger their retry mechanism
      // If it's a 404 (Shipment not found), we might just ignore it. 
      // If it's a database connection issue, we throw 500 to let provider retry.
      throw error; 
    }
  }
}
