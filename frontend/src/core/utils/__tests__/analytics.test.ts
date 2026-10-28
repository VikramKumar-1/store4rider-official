import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  pushToDataLayer,
  trackPageView,
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
} from "../analytics";

describe("Analytics Utility (GA4 & Meta Pixel)", () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.fbq = vi.fn();
  });

  it("should push events to dataLayer safely", () => {
    pushToDataLayer({ event: "test_event", foo: "bar" });
    expect(window.dataLayer).toContainEqual({ event: "test_event", foo: "bar" });
  });

  it("should track page_view on GA4 and PageView on Meta Pixel", () => {
    trackPageView("/products/helmet-1", "Cool Helmet");
    expect(window.dataLayer).toContainEqual({
      event: "page_view",
      page_location: "/products/helmet-1",
      page_title: "Cool Helmet",
    });
    expect(window.fbq).toHaveBeenCalledWith("track", "PageView");
  });

  it("should track view_item for product view", () => {
    trackViewItem({
      id: "prod_1",
      name: "SMK Helmet",
      category: "Helmets",
      price: 5499,
      brand: "SMK",
    });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "view_item",
        ecommerce: {
          currency: "INR",
          value: 5499,
          items: [
            expect.objectContaining({
              item_id: "prod_1",
              item_name: "SMK Helmet",
              item_category: "Helmets",
              price: 5499,
            }),
          ],
        },
      })
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "ViewContent",
      expect.objectContaining({
        content_name: "SMK Helmet",
        content_ids: ["prod_1"],
        value: 5499,
        currency: "INR",
      })
    );
  });

  it("should track add_to_cart with quantity calculation", () => {
    trackAddToCart({
      id: "prod_1",
      name: "Riding Gloves",
      category: "Gloves",
      price: 1500,
      quantity: 2,
    });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "add_to_cart",
        ecommerce: {
          currency: "INR",
          value: 3000,
          items: [
            expect.objectContaining({
              item_id: "prod_1",
              quantity: 2,
              price: 1500,
            }),
          ],
        },
      })
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "AddToCart",
      expect.objectContaining({
        content_name: "Riding Gloves",
        value: 3000,
        currency: "INR",
      })
    );
  });

  it("should track remove_from_cart", () => {
    trackRemoveFromCart({
      id: "prod_1",
      name: "Riding Gloves",
      price: 1500,
      quantity: 1,
    });

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "remove_from_cart",
        ecommerce: {
          currency: "INR",
          value: 1500,
          items: [expect.objectContaining({ item_id: "prod_1" })],
        },
      })
    );
  });

  it("should track begin_checkout", () => {
    trackBeginCheckout(
      [
        { id: "p1", name: "Helmet", price: 5000, quantity: 1 },
        { id: "p2", name: "Gloves", price: 2000, quantity: 2 },
      ],
      9000
    );

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "begin_checkout",
        ecommerce: {
          currency: "INR",
          value: 9000,
          items: expect.any(Array),
        },
      })
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "InitiateCheckout",
      expect.objectContaining({
        content_ids: ["p1", "p2"],
        num_items: 3,
        value: 9000,
        currency: "INR",
      })
    );
  });

  it("should track purchase with eventID for Meta CAPI deduplication", () => {
    trackPurchase(
      {
        orderId: "ORD-998877",
        total: 7500,
        tax: 900,
        shipping: 100,
        items: [{ id: "p1", name: "Helmet", price: 6500, quantity: 1 }],
      },
      "evt_998877"
    );

    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: "purchase",
        ecommerce: {
          transaction_id: "ORD-998877",
          value: 7500,
          tax: 900,
          shipping: 100,
          currency: "INR",
          coupon: undefined,
          items: expect.any(Array),
        },
      })
    );

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      expect.objectContaining({
        value: 7500,
        currency: "INR",
      }),
      { eventID: "evt_998877" }
    );
  });

  it("should track search terms", () => {
    trackSearch("carbon helmet");
    expect(window.dataLayer).toContainEqual({
      event: "search",
      search_term: "carbon helmet",
    });
    expect(window.fbq).toHaveBeenCalledWith("track", "Search", {
      search_string: "carbon helmet",
    });
  });
});
