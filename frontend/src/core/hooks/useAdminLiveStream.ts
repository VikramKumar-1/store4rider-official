"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";

interface AdminLiveEvent {
  type: string;
  payload: any;
  timestamp: number;
}

/**
 * Enterprise Real-Time Live Stream Hook for Store4Riders Admin
 * Subscribes to Server-Sent Events (SSE) from the backend.
 * Provides instant event-driven table/KPI invalidations with ZERO idle database queries.
 * Handles automatic reconnection, Page Visibility re-sync, and offline grace.
 */
export function useAdminLiveStream() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only establish connection for authenticated staff/admin roles
    const role = user?.role;
    const isStaff = ["admin", "superadmin", "manager", "staff", "logistic"].includes(role || "");
    if (!isStaff) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      // Clean up any stale connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const streamUrl = `${API_URL}/admin/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      
      try {
        const es = new EventSource(streamUrl, { withCredentials: true });
        eventSourceRef.current = es;

        const handleEvent = (event: MessageEvent) => {
          try {
            const data: AdminLiveEvent = JSON.parse(event.data);

            switch (data.type) {
              case "ORDER_CREATED":
                queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "recent-orders"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "logistics-stats"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
                if (data.payload?.orderNumber) {
                  toast.success(`New Order: #${data.payload.orderNumber}`, {
                    description: data.payload?.paymentMethod ? `Payment: ${String(data.payload.paymentMethod).toUpperCase()}` : undefined,
                  });
                }
                break;

              case "ORDER_UPDATED":
              case "ORDER_STATUS_CHANGED":
                queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "recent-orders"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "logistics-stats"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
                break;

              case "SHIPMENT_CREATED":
              case "SHIPMENT_UPDATED":
                queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "logistics-stats"] });
                queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
                if (data.payload?.awb) {
                  toast.info(`Shipment Dispatched`, {
                    description: `AWB: ${data.payload.awb} (${data.payload.courierName || "Courier"})`,
                  });
                }
                break;

              case "DASHBOARD_REFRESH":
                queryClient.invalidateQueries({ queryKey: ["admin"] });
                break;
            }
          } catch {
            // Ignore keep-alive or ping comments
          }
        };

        es.addEventListener("ORDER_CREATED", handleEvent);
        es.addEventListener("ORDER_UPDATED", handleEvent);
        es.addEventListener("ORDER_STATUS_CHANGED", handleEvent);
        es.addEventListener("SHIPMENT_CREATED", handleEvent);
        es.addEventListener("SHIPMENT_UPDATED", handleEvent);
        es.addEventListener("DASHBOARD_REFRESH", handleEvent);

        es.onerror = () => {
          if (es.readyState === EventSource.CLOSED) {
            es.close();
            eventSourceRef.current = null;
            // Graceful reconnect retry after 5 seconds
            if (isMounted && !reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                connect();
              }, 5000);
            }
          }
        };
      } catch {
        // Safe degrade if browser environment lacks EventSource
      }
    };

    connect();

    // Reconnect/re-sync when merchant switches back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          connect();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [token, user?.role, queryClient]);
}
