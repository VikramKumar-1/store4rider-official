"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  XMarkIcon, 
  TruckIcon, 
  MapPinIcon, 
  CheckCircleIcon, 
  ClipboardDocumentIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
import { useOrderShipments } from "@/core/hooks/useShipments";

interface AdminTrackingModalProps {
  order: any;
  onClose: () => void;
}

export const AdminTrackingModal: React.FC<AdminTrackingModalProps> = ({ order, onClose }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted || typeof document === "undefined" || !order) return null;

  const orderId = order.id || order._id || order.orderNumber;
  const orderNum = order.orderNumber || orderId;

  // Fetch live shipment events from backend
  const { data: shipments, isLoading, isFetching, refetch } = useOrderShipments(orderId);

  // Active shipment (prefer API data, fallback to order embedded shipment)
  const activeShipment = shipments?.[0] || order.shipment || {};
  const awb = activeShipment.awb || activeShipment.trackingNumber || order.awb || "AWB-PENDING";
  const courierName = activeShipment.courierName || activeShipment.provider || "Courier Partner";
  const trackingUrl = activeShipment.trackingUrl;
  const rawStatus = (activeShipment.status || order.fulfillmentStatus || order.status || "").toLowerCase();
  const events = activeShipment.events || [];

  // Determine current milestone stage
  let currentStep = 1; // 1: Placed, 2: Packed, 3: In Transit, 4: Out for Delivery, 5: Delivered
  if (["delivered"].includes(rawStatus)) {
    currentStep = 5;
  } else if (["out_for_delivery"].includes(rawStatus)) {
    currentStep = 4;
  } else if (["in_transit", "shipped", "picked_up"].includes(rawStatus)) {
    currentStep = 3;
  } else if (["packed", "ready_for_pickup"].includes(rawStatus) || awb !== "AWB-PENDING") {
    currentStep = 2;
  }

  const isRto = rawStatus.includes("rto") || rawStatus.includes("returned");
  const isFailed = rawStatus.includes("issue") || rawStatus.includes("failed");

  // Customer Destination
  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || "Customer";
  const customerPhone = order.customer?.phone || order.shippingAddress?.phone || "";
  const addressLine1 = order.customer?.addressLine1 || order.shippingAddress?.addressLine1 || (order.shippingAddress as any)?.street || "";
  const addressLine2 = order.customer?.addressLine2 || order.shippingAddress?.addressLine2 || "";
  const city = order.customer?.city || order.shippingAddress?.city || "";
  const state = order.customer?.state || order.shippingAddress?.state || "";
  const pincode = order.customer?.pincode || order.shippingAddress?.pincode || "";
  const fullAddress = [addressLine1, addressLine2, city, state, pincode ? `(${pincode})` : ""].filter(Boolean).join(", ");

  const handleCopyAwb = () => {
    if (!awb || awb === "AWB-PENDING") return;
    navigator.clipboard.writeText(awb);
    toast.success(`AWB ${awb} copied!`);
  };

  const steps = [
    { title: "Order Placed", subtitle: order.createdAt ? format(new Date(order.createdAt), "dd MMM, hh:mm a") : "Confirmed" },
    { title: "Packed & Ready", subtitle: activeShipment.createdAt ? format(new Date(activeShipment.createdAt), "dd MMM, hh:mm a") : "Handover scheduled" },
    { title: "In Transit", subtitle: currentStep >= 3 ? "On the way" : "Pending pickup" },
    { title: "Out for Delivery", subtitle: currentStep >= 4 ? "Delivery agent out" : "Awaiting destination hub" },
    { title: "Delivered", subtitle: currentStep === 5 ? "Delivered to customer" : "Final destination" },
  ];

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <TruckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Live Tracking • Order #{orderNum}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  currentStep === 5
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : currentStep === 4
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    : currentStep === 3
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : isRto
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-sky-100 text-sky-800 border border-sky-200"
                }`}>
                  {isRto ? "Return to Origin (RTO)" : isFailed ? "Delivery Issue" : steps[currentStep - 1]?.title || "Processing"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current delivery status &amp; courier transit scans
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Refresh tracking status"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isFetching ? "animate-spin text-brand" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close tracking modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Carrier & AWB Details Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Courier Partner &amp; AWB
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-extrabold text-sm text-slate-900 uppercase">
                  {courierName}
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {awb}
                </span>
                {awb !== "AWB-PENDING" && (
                  <button
                    type="button"
                    onClick={handleCopyAwb}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    title="Copy AWB number"
                  >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Destination */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0 mt-0.5">
              <MapPinIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Destination Consignee
              </span>
              <p className="font-bold text-xs text-slate-900 mt-0.5">
                {customerName} {customerPhone ? `(${customerPhone})` : ""}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words font-medium">
                {fullAddress || "Address provided at checkout"}
              </p>
            </div>
          </div>

          {/* Visual Milestone Progress Tracker */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Fulfillment Journey
            </span>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 -z-0">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))}%` }}
                />
              </div>

              {/* Step Circles */}
              <div className="grid grid-cols-5 relative z-10 text-center">
                {steps.map((step, idx) => {
                  const stepNum = idx + 1;
                  const isDone = currentStep >= stepNum;
                  const isCurrent = currentStep === stepNum;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 shadow-sm"
                          : isDone
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-slate-400 border-slate-300"
                      }`}>
                        {isDone && !isCurrent ? (
                          <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                          <span>{stepNum}</span>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 block leading-tight ${
                        isCurrent ? "text-blue-700 font-extrabold" : isDone ? "text-slate-900" : "text-slate-400"
                      }`}>
                        {step.title}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block truncate max-w-[90px]">
                        {step.subtitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Courier Scan Activity History */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Live Scan Updates ({events.length})
              </span>
              {isFetching && (
                <span className="text-[10px] font-semibold text-blue-600 animate-pulse flex items-center gap-1">
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  <span>Checking courier server...</span>
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
                Loading live tracking events...
              </div>
            ) : events.length === 0 ? (
              <div className="py-6 px-4 bg-slate-50 border border-slate-100 rounded-lg text-center space-y-1">
                <ClockIcon className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Package Registered with {courierName}</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  AWB barcode generated. Scan updates will appear here automatically as soon as the courier scans the package at their sorting hub.
                </p>
              </div>
            ) : (
              <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {events.map((ev: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 relative pl-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute left-1 top-1.5 ring-4 ring-white" />
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 w-full">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-xs text-slate-900 capitalize">
                          {ev.status?.replace(/_/g, " ") || ev.activity || "In Transit"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {ev.timestamp ? format(new Date(ev.timestamp), "dd MMM, hh:mm a") : "-"}
                        </span>
                      </div>
                      {ev.location && (
                        <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                          <MapPinIcon className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{ev.location}</span>
                        </p>
                      )}
                      {ev.description && ev.description !== ev.status && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{ev.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Live status synchronized with {courierName} network.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
