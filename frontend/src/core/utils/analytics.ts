/**
 * @file analytics.ts
 * @description Enterprise Analytics & Event Tracking for Google Analytics 4 (GA4) & Meta Facebook Pixel.
 * Pushes standard eCommerce events to GTM dataLayer and fbq pixel queue.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    fbq?: (
      command: "track" | "trackCustom" | "init",
      eventName: string,
      params?: Record<string, any>,
      options?: { eventID?: string }
    ) => void;
  }
}

export interface AnalyticsItem {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity?: number;
  brand?: string;
  variant?: string;
}

export interface AnalyticsOrder {
  orderId: string;
  total: number;
  tax?: number;
  shipping?: number;
  coupon?: string;
  items: AnalyticsItem[];
}

/**
 * Safely push an event to Google Tag Manager dataLayer.
 */
export function pushToDataLayer(eventPayload: Record<string, any>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(eventPayload);
}

/**
 * Safely track an event with Meta Facebook Pixel.
 */
export function trackMetaPixel(
  eventName: string,
  params?: Record<string, any>,
  options?: { eventID?: string }
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (options?.eventID) {
    window.fbq("track", eventName, params, { eventID: options.eventID });
  } else if (params) {
    window.fbq("track", eventName, params);
  } else {
    window.fbq("track", eventName);
  }
}

/**
 * Track Page View on route change or initial load.
 */
export function trackPageView(url: string, title?: string): void {
  pushToDataLayer({
    event: "page_view",
    page_location: url,
    page_title: title || (typeof document !== "undefined" ? document.title : ""),
  });
  trackMetaPixel("PageView");
}

/**
 * Track PDP / Product View.
 */
export function trackViewItem(item: AnalyticsItem): void {
  const formattedItem = {
    item_id: item.id,
    item_name: item.name,
    item_category: item.category || "Motorcycle Gear",
    price: item.price,
    quantity: item.quantity || 1,
    item_brand: item.brand || "Store4Riders",
    item_variant: item.variant,
  };

  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency: "INR",
      value: item.price,
      items: [formattedItem],
    },
  });

  trackMetaPixel("ViewContent", {
    content_name: item.name,
    content_ids: [item.id],
    content_type: "product",
    value: item.price,
    currency: "INR",
  });
}

/**
 * Track Add to Cart.
 */
export function trackAddToCart(item: AnalyticsItem): void {
  const qty = item.quantity || 1;
  const totalValue = item.price * qty;

  const formattedItem = {
    item_id: item.id,
    item_name: item.name,
    item_category: item.category || "Motorcycle Gear",
    price: item.price,
    quantity: qty,
    item_brand: item.brand || "Store4Riders",
    item_variant: item.variant,
  };

  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: "INR",
      value: totalValue,
      items: [formattedItem],
    },
  });

  trackMetaPixel("AddToCart", {
    content_name: item.name,
    content_ids: [item.id],
    content_type: "product",
    value: totalValue,
    currency: "INR",
  });
}

/**
 * Track Remove from Cart.
 */
export function trackRemoveFromCart(item: AnalyticsItem): void {
  const qty = item.quantity || 1;
  const formattedItem = {
    item_id: item.id,
    item_name: item.name,
    item_category: item.category || "Motorcycle Gear",
    price: item.price,
    quantity: qty,
  };

  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency: "INR",
      value: item.price * qty,
      items: [formattedItem],
    },
  });
}

/**
 * Track Checkout Initiation.
 */
export function trackBeginCheckout(items: AnalyticsItem[], totalValue: number): void {
  const formattedItems = items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    item_category: i.category || "Motorcycle Gear",
    price: i.price,
    quantity: i.quantity || 1,
    item_brand: i.brand || "Store4Riders",
  }));

  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "INR",
      value: totalValue,
      items: formattedItems,
    },
  });

  trackMetaPixel("InitiateCheckout", {
    content_ids: items.map((i) => i.id),
    content_type: "product",
    num_items: items.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
    value: totalValue,
    currency: "INR",
  });
}

/**
 * Track Successful Purchase.
 * Supports Meta CAPI deduplication via eventId.
 */
export function trackPurchase(order: AnalyticsOrder, eventId?: string): void {
  const formattedItems = order.items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    item_category: i.category || "Motorcycle Gear",
    price: i.price,
    quantity: i.quantity || 1,
    item_brand: i.brand || "Store4Riders",
  }));

  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: order.orderId,
      value: order.total,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      currency: "INR",
      coupon: order.coupon,
      items: formattedItems,
    },
  });

  trackMetaPixel(
    "Purchase",
    {
      content_ids: order.items.map((i) => i.id),
      content_type: "product",
      contents: order.items.map((i) => ({
        id: i.id,
        quantity: i.quantity || 1,
        item_price: i.price,
      })),
      value: order.total,
      currency: "INR",
      num_items: order.items.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
    },
    { eventID: eventId || order.orderId }
  );
}

/**
 * Track Site Search.
 */
export function trackSearch(searchTerm: string): void {
  if (!searchTerm.trim()) return;

  pushToDataLayer({
    event: "search",
    search_term: searchTerm.trim(),
  });

  trackMetaPixel("Search", {
    search_string: searchTerm.trim(),
  });
}
