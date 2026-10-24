import { describe, it, expect, vi } from "vitest";
import { AdminEventHub } from "../adminEventHub";

describe("AdminEventHub - Edge Cases & Adversarial Stress Tests", () => {
  it("should subscribe and receive published events in memory", () => {
    const hub = new AdminEventHub();
    const callback = vi.fn();
    const unsubscribe = hub.subscribe(callback);

    hub.publish("ORDER_CREATED", {
      orderId: "ord_test_123",
      orderNumber: "OD-9999",
      amount: 4999,
    });

    expect(callback).toHaveBeenCalledTimes(1);
    const eventArg = callback.mock.calls[0][0];
    expect(eventArg.type).toBe("ORDER_CREATED");
    expect(eventArg.payload.orderId).toBe("ord_test_123");
    expect(eventArg.payload.orderNumber).toBe("OD-9999");
    expect(typeof eventArg.timestamp).toBe("number");

    unsubscribe();
    hub.publish("ORDER_CREATED", { orderId: "ord_test_456" });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("EDGE CASE: faulty listener throwing an error does NOT crash publisher or other subscribers", () => {
    const hub = new AdminEventHub();
    const faultySubscriber = vi.fn(() => {
      throw new Error("Simulated client connection crash or memory failure");
    });
    const healthySubscriber = vi.fn();

    hub.subscribe(faultySubscriber);
    hub.subscribe(healthySubscriber);

    // Publishing should not throw, despite the first listener throwing
    expect(() => {
      hub.publish("ORDER_CREATED", { orderId: "ord_fault_test" });
    }).not.toThrow();

    expect(faultySubscriber).toHaveBeenCalledTimes(1);
    expect(healthySubscriber).toHaveBeenCalledTimes(1);
    expect(healthySubscriber.mock.calls[0][0].payload.orderId).toBe("ord_fault_test");
  });

  it("EDGE CASE: multiple / idempotent unsubscriptions must not throw or alter listener state", () => {
    const hub = new AdminEventHub();
    const callback = vi.fn();
    const unsubscribe = hub.subscribe(callback);

    expect(hub.getListenerCount()).toBe(1);

    // Call unsubscribe multiple times
    expect(() => {
      unsubscribe();
      unsubscribe();
      unsubscribe();
    }).not.toThrow();

    expect(hub.getListenerCount()).toBe(0);
  });

  it("EDGE CASE: handles undefined, null, and empty payloads without breaking", () => {
    const hub = new AdminEventHub();
    const callback = vi.fn();
    hub.subscribe(callback);

    expect(() => {
      hub.publish("DASHBOARD_REFRESH", null);
      hub.publish("DASHBOARD_REFRESH", undefined);
      hub.publish("DASHBOARD_REFRESH", {});
    }).not.toThrow();

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback.mock.calls[0][0].payload).toBeNull();
    expect(callback.mock.calls[1][0].payload).toBeUndefined();
    expect(callback.mock.calls[2][0].payload).toEqual({});
  });

  it("STRESS TEST: rapid concurrent burst of 100 events maintains FIFO order and data integrity", () => {
    const hub = new AdminEventHub();
    const receivedIds: number[] = [];
    hub.subscribe((event) => {
      receivedIds.push(event.payload.index);
    });

    for (let i = 0; i < 100; i++) {
      hub.publish("ORDER_UPDATED", { index: i });
    }

    expect(receivedIds.length).toBe(100);
    expect(receivedIds[0]).toBe(0);
    expect(receivedIds[99]).toBe(99);
  });
});
