import crypto from "crypto";
import { logger } from "@/core/utils/logger";

export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  clientIp?: string;
  clientUserAgent?: string;
}

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_type?: string;
  content_ids?: string[];
  contents?: Array<{
    id: string;
    quantity: number;
    item_price?: number;
  }>;
  order_id?: string;
}

export interface MetaEventPayload {
  eventName: "Purchase" | "AddToCart" | "InitiateCheckout" | "ViewContent";
  eventId: string;
  eventSourceUrl?: string;
  userData: MetaUserData;
  customData?: MetaCustomData;
}

function hashSha256(value?: string): string | undefined {
  if (!value) return undefined;
  const clean = value.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

function hashPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Clean all non-digits
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return undefined;
  return crypto.createHash("sha256").update(digitsOnly).digest("hex");
}

export class MetaConversionService {
  private static pixelId = process.env.FB_PIXEL_ID || process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  private static accessToken = process.env.FB_ACCESS_TOKEN;
  private static apiVersion = "v19.0";

  /**
   * Dispatches a server-side event to Meta Conversions API (CAPI).
   * Safe to call fire-and-forget: never throws or disrupts critical checkout flows.
   */
  static async sendEvent(payload: MetaEventPayload): Promise<boolean> {
    const pixelId = this.pixelId;
    const accessToken = this.accessToken;

    if (!pixelId || !accessToken) {
      logger.info(
        `[MetaCAPI] Skipped ${payload.eventName} (${payload.eventId}): FB_PIXEL_ID or FB_ACCESS_TOKEN not configured.`
      );
      return false;
    }

    try {
      const hashedEmail = hashSha256(payload.userData.email);
      const hashedPhone = hashPhone(payload.userData.phone);
      const hashedFirstName = hashSha256(payload.userData.firstName);
      const hashedLastName = hashSha256(payload.userData.lastName);

      const eventData = {
        event_name: payload.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        action_source: "website",
        event_source_url:
          payload.eventSourceUrl ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://store4riders.com",
        user_data: {
          ...(hashedEmail && { em: [hashedEmail] }),
          ...(hashedPhone && { ph: [hashedPhone] }),
          ...(hashedFirstName && { fn: [hashedFirstName] }),
          ...(hashedLastName && { ln: [hashedLastName] }),
          ...(payload.userData.clientIp && { client_ip_address: payload.userData.clientIp }),
          ...(payload.userData.clientUserAgent && {
            client_user_agent: payload.userData.clientUserAgent,
          }),
        },
        custom_data: {
          currency: payload.customData?.currency || "INR",
          value: payload.customData?.value,
          content_type: payload.customData?.content_type || "product",
          content_ids: payload.customData?.content_ids,
          contents: payload.customData?.contents,
          order_id: payload.customData?.order_id,
        },
      };

      const url = `https://graph.facebook.com/${this.apiVersion}/${pixelId}/events?access_token=${accessToken}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [eventData],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        logger.error(
          `[MetaCAPI] Failed to dispatch ${payload.eventName} (${payload.eventId}): ${JSON.stringify(
            result
          )}`
        );
        return false;
      }

      logger.info(
        `[MetaCAPI] Successfully dispatched ${payload.eventName} (${payload.eventId}) with status ${response.status}.`
      );
      return true;
    } catch (err: any) {
      logger.error(
        `[MetaCAPI] Unexpected error dispatching ${payload.eventName} (${payload.eventId}): ${err.message}`
      );
      return false;
    }
  }

  /**
   * Helper to dispatch Purchase event on order confirmation.
   */
  static async trackPurchase(order: any, clientIp?: string, clientUserAgent?: string): Promise<void> {
    if (!order) return;

    const eventId = order.orderNumber || String(order._id);
    const email = order.customer?.email || order.shippingAddress?.email;
    const phone = order.customer?.phone || order.shippingAddress?.phone;
    const firstName = order.shippingAddress?.firstName || order.customer?.firstName;
    const lastName = order.shippingAddress?.lastName || order.customer?.lastName;

    const items = (order.items || []).map((i: any) => ({
      id: i.sku || String(i.productId),
      quantity: i.quantity || 1,
      item_price: i.unitPrice || 0,
    }));

    await this.sendEvent({
      eventName: "Purchase",
      eventId,
      userData: {
        email,
        phone,
        firstName,
        lastName,
        clientIp,
        clientUserAgent,
      },
      customData: {
        currency: order.pricing?.currency || "INR",
        value: order.pricing?.total || 0,
        content_type: "product",
        content_ids: items.map((i: any) => i.id),
        contents: items,
        order_id: order.orderNumber || String(order._id),
      },
    });
  }
}
