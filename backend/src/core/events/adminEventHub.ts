import { EventEmitter } from "events";
import { logger } from "../utils/logger";
import { redisClient, isRedisConnected } from "../cache/redis";

export type AdminEventType =
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_STATUS_CHANGED"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_UPDATED"
  | "DASHBOARD_REFRESH";

export interface AdminEvent<T = any> {
  type: AdminEventType;
  payload: T;
  timestamp: number;
  originId?: string;
}

export class AdminEventHub {
  private emitter: EventEmitter;
  private instanceId: string;
  private isSubscribedToRedis = false;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(250);
    // Ignore internal error events to prevent process crashes
    this.emitter.on("error", (err) => {
      logger.warn(`[AdminEventHub] Suppressed emitter error: ${err.message}`);
    });
    this.instanceId = Math.random().toString(36).substring(2, 10);
    this.initRedisSubscriber();
  }

  private async initRedisSubscriber() {
    if (!redisClient || !isRedisConnected) return;
    try {
      const subClient = redisClient.duplicate();
      subClient.on("connect", () => {
        subClient.subscribe("store4riders:admin:events", (err) => {
          if (!err) {
            this.isSubscribedToRedis = true;
          }
        });
      });
      subClient.on("message", (channel: string, message: string) => {
        if (channel === "store4riders:admin:events") {
          try {
            const event: AdminEvent = JSON.parse(message);
            if (event.originId !== this.instanceId) {
              this.emitter.emit("admin_event", event);
            }
          } catch {
            // Safe degrade: ignore malformed message
          }
        }
      });
      subClient.on("error", () => {
        this.isSubscribedToRedis = false;
      });
    } catch {
      this.isSubscribedToRedis = false;
    }
  }

  /**
   * Publish an event to all connected admin clients.
   * Dispatches via in-memory EventEmitter immediately, and Redis Pub/Sub if active.
   * Fault-tolerant: Exceptions are isolated and never crash the caller.
   */
  public publish<T = any>(type: AdminEventType, payload: T) {
    const event: AdminEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      originId: this.instanceId,
    };

    // 1. Immediate in-process dispatch (0ms latency, isolated)
    try {
      this.emitter.emit("admin_event", event);
    } catch (err: any) {
      logger.error(`[AdminEventHub] In-memory publish error: ${err?.message}`);
    }

    // 2. Cross-instance dispatch via Redis if connected
    if (redisClient && isRedisConnected) {
      try {
        redisClient.publish("store4riders:admin:events", JSON.stringify(event)).catch(() => {});
      } catch {
        // Safe degrade: in-process already fired
      }
    }
  }

  /**
   * Subscribe a client connection to live admin events.
   * Defensively wraps listener to prevent one faulty consumer from breaking others.
   * Returns an idempotent unsubscribe callback.
   */
  public subscribe(listener: (event: AdminEvent) => void): () => void {
    const safeListener = (event: AdminEvent) => {
      try {
        listener(event);
      } catch (err: any) {
        logger.warn(`[AdminEventHub] Error in subscriber listener: ${err?.message}`);
      }
    };

    this.emitter.on("admin_event", safeListener);

    let unsubscribed = false;
    return () => {
      if (unsubscribed) return;
      unsubscribed = true;
      this.emitter.off("admin_event", safeListener);
    };
  }

  public getListenerCount(): number {
    return this.emitter.listenerCount("admin_event");
  }
}

// Global singleton to survive Next.js module re-evaluations
const globalForEvents = globalThis as unknown as { adminEventHub?: AdminEventHub };
export const adminEventHub = globalForEvents.adminEventHub || new AdminEventHub();
if (process.env.NODE_ENV !== "production") {
  globalForEvents.adminEventHub = adminEventHub;
}
