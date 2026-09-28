"use client";

import React from "react";
import Link from "next/link";
import { useOrderById } from "@/core/hooks/useOrderById";
import { useOrderShipments } from "@/core/hooks/useShipments";
import { ShipmentInfoCard } from "./ShipmentInfoCard";
import { TrackingTimeline } from "./TrackingTimeline";
import { formatPrice } from "@store4riders/shared-utils";
import { useGenerateInvoice, useRequestReturn } from "@/core/hooks/useOrderActions";

const OrderActionsRow = ({ order }: { order: any }) => {
  const generateInvoiceMutation = useGenerateInvoice();
  const requestReturnMutation = useRequestReturn();
  const [returnReason, setReturnReason] = React.useState("");
  const [showReturnInput, setShowReturnInput] = React.useState(false);

  const handleReturn = () => {
    if (!returnReason.trim()) return;
    requestReturnMutation.mutate({ orderId: order.id || order._id, reason: returnReason });
  };

  return (
    <div className="mt-6 flex flex-wrap gap-4 border-t border-neutral-100 pt-6">
      <button
        onClick={() => generateInvoiceMutation.mutate(order.id || order._id)}
        disabled={generateInvoiceMutation.isPending}
        className="px-4 py-2 border border-neutral-300 text-neutral-800 text-xs font-bold uppercase rounded hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        {generateInvoiceMutation.isPending ? "Generating..." : "Download Invoice"}
      </button>

      {order.status === "delivered" && (
        <div className="flex flex-col gap-2">
          {!showReturnInput ? (
            <button
              onClick={() => setShowReturnInput(true)}
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase rounded hover:bg-neutral-800 transition-colors"
            >
              Request Return
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Reason for return..." 
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                className="px-3 py-1.5 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
              />
              <button 
                onClick={handleReturn}
                disabled={requestReturnMutation.isPending || !returnReason.trim()}
                className="px-4 py-2 bg-brand text-white text-xs font-bold uppercase rounded hover:bg-red-800 disabled:opacity-50"
              >
                {requestReturnMutation.isPending ? "..." : "Submit"}
              </button>
              <button onClick={() => setShowReturnInput(false)} className="text-xs text-neutral-500 uppercase font-bold px-2">Cancel</button>
            </div>
          )}
        </div>
      )}
      
      {order.status === "return_requested" && (
        <span className="px-4 py-2 bg-orange-100 text-orange-800 text-xs font-bold uppercase rounded">
          Return Pending Approval
        </span>
      )}
      {order.status === "return_approved" && (
        <span className="px-4 py-2 bg-purple-100 text-purple-800 text-xs font-bold uppercase rounded">
          Return Approved - Pickup Scheduled
        </span>
      )}
      {order.status === "returned" && (
        <span className="px-4 py-2 bg-green-100 text-green-800 text-xs font-bold uppercase rounded">
          Returned & Refunded
        </span>
      )}
    </div>
  );
};

export const OrderTrackingModule = ({ orderId }: { orderId: string }) => {
  const { data: order, isLoading: isOrderLoading, error: orderError } = useOrderById(orderId);
  const { data: shipments, isLoading: isShipmentsLoading } = useOrderShipments(orderId);

  if (isOrderLoading || isShipmentsLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-10 animate-pulse">
        <div className="h-8 bg-neutral-200 w-1/4 mb-6" />
        <div className="h-24 bg-neutral-100 mb-8" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 h-96 bg-neutral-100" />
          <div className="w-full lg:w-2/3 h-96 bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Order Not Found</h2>
        <p className="text-neutral-500 mb-8">We couldn't find tracking information for this order.</p>
        <Link href="/account/orders" className="bg-brand text-white px-6 py-3 font-bold text-sm uppercase">
          Back to Orders
        </Link>
      </div>
    );
  }

  // We support multiple shipments per order, but typically it's just one forward shipment
  const forwardShipments = shipments?.filter(s => s.shipmentType === "forward") || [];

  return (
    <div className="bg-neutral-50 min-h-screen pb-20">
      <div className="bg-white border-b border-neutral-200 py-6 mb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Link href="/account/orders" className="text-xs font-bold text-neutral-500 hover:text-brand uppercase mb-4 inline-block">
            ← Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-sans font-black text-2xl md:text-3xl text-neutral-900 uppercase tracking-tight">
                Track Order
              </h1>
              <p className="text-sm text-neutral-500 font-medium mt-1">
                Order #{order.orderNumber || order.id || (order as any)._id} • {order.items?.length || 0} items
              </p>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-neutral-500 uppercase">Order Total</span>
              <span className="font-sans font-black text-xl text-brand">{formatPrice(order.pricing?.total || 0)}</span>
            </div>
          </div>
          
          <OrderActionsRow order={order} />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {forwardShipments.length === 0 ? (
          <div className="bg-white border border-neutral-200 shadow-sm p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-neutral-900 uppercase mb-2">Preparing for Dispatch</h3>
            <p className="text-neutral-500 max-w-md">Your order is currently being processed. Tracking details will appear here once the shipment is assigned to a courier.</p>
          </div>
        ) : (
          forwardShipments.map((shipment, index) => (
            <div key={shipment.id || String(shipment._id) || index} className="mb-12">
              {forwardShipments.length > 1 && (
                <h2 className="font-bold text-lg text-neutral-800 uppercase mb-4">Package {index + 1}</h2>
              )}
              <ShipmentInfoCard shipment={shipment} />
              <TrackingTimeline 
                events={shipment.events || []} 
                currentStatus={shipment.status} 
                orderCreatedAt={order.createdAt || new Date()} 
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
