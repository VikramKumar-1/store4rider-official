"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { 
  XMarkIcon, 
  TruckIcon, 
  DocumentTextIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  PrinterIcon,
  BuildingStorefrontIcon,
  ScaleIcon
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrderById } from "@/core/hooks/useOrderById";
import { useWarehouses } from "@/core/hooks/useWarehouses";
import { useCreateManualShipment, usePushToShiprocket } from "@/core/hooks/useAdminShipments";
import { ShippingLabelModal } from "./ShippingLabelModal";
import { AdminTrackingModal } from "./AdminTrackingModal";

interface OrderFulfillmentPanelProps {
  orderId: string;
  onClose: () => void;
}

type CourierOption = {
  id: string;
  name: string;
  badge: string;
  prefix: string;
  color: string;
};

const COURIER_PARTNERS: CourierOption[] = [
  {
    id: "shiprocket",
    name: "Shiprocket",
    badge: "Aggregator (Default)",
    prefix: "SR",
    color: "border-orange-500 bg-orange-50/50 text-orange-950",
  },
  {
    id: "xpressbees",
    name: "Xpressbees",
    badge: "Express Surface & Air",
    prefix: "XPR",
    color: "border-purple-500 bg-purple-50/50 text-purple-950",
  },
  {
    id: "delhivery",
    name: "Delhivery",
    badge: "Direct Surface / Air",
    prefix: "DLV",
    color: "border-slate-700 bg-slate-50 text-slate-900",
  },
];

export const OrderFulfillmentPanel: React.FC<OrderFulfillmentPanelProps> = ({ orderId, onClose }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: order, isLoading: isOrderLoading } = useAdminOrderById(orderId);
  const { data: warehouses = [], isLoading: isWarehousesLoading } = useWarehouses();
  const createManualMutation = useCreateManualShipment();
  const pushToShiprocketMutation = usePushToShiprocket();

  const [selectedCourierId, setSelectedCourierId] = useState<string>("shiprocket");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [packageWeight, setPackageWeight] = useState<string>("1.0");
  const [dimensions, setDimensions] = useState({ length: 15, breadth: 15, height: 10 });
  const [awbNumber, setAwbNumber] = useState<string>("");
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false);
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);

  // Auto-select warehouse when loaded
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !selectedWarehouseId) {
      const matchOrder = warehouses.find((w: any) => String(w._id || w.id) === String(order?.warehouseId));
      if (matchOrder) {
        setSelectedWarehouseId(String(matchOrder._id || matchOrder.id));
      } else {
        const defaultWh = warehouses.find((w: any) => w.isDefault) || warehouses[0];
        if (defaultWh) {
          setSelectedWarehouseId(String(defaultWh._id || defaultWh.id));
        }
      }
    }
  }, [warehouses, order?.warehouseId, selectedWarehouseId]);

  // Pre-calculate weight from order items
  useEffect(() => {
    if (order?.items && order.items.length > 0) {
      const totalUnits = order.items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
      const estWeight = Math.max(0.5, Number((totalUnits * 0.5).toFixed(2)));
      setPackageWeight(String(estWeight));
    }
  }, [order?.items]);

  const selectedCourier = COURIER_PARTNERS.find((c) => c.id === selectedCourierId) || COURIER_PARTNERS[0];

  const numWeight = parseFloat(packageWeight) || 0.5;
  const numLength = Number(dimensions.length) || 15;
  const numBreadth = Number(dimensions.breadth) || 15;
  const numHeight = Number(dimensions.height) || 10;
  const volumetricWeight = Number(((numLength * numBreadth * numHeight) / 5000).toFixed(2));
  const billableWeight = Number(Math.max(numWeight, volumetricWeight).toFixed(2));

  const handlePushToShiprocket = () => {
    setErrorMessage(null);
    const weightVal = parseFloat(packageWeight);
    if (isNaN(weightVal) || weightVal <= 0) {
      const msg = "Please enter a valid package weight (e.g. 0.5 kg).";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    pushToShiprocketMutation.mutate(
      {
        orderId,
        warehouseId: selectedWarehouseId || undefined,
        weightKg: weightVal,
        length: numLength,
        breadth: numBreadth,
        height: numHeight,
      },
      {
        onSuccess: (data: any) => {
          setCreatedShipment({
            ...data,
            courierName: data?.courierName || "Shiprocket",
            provider: "shiprocket",
            awb: data?.awb || null,
            labelUrl: data?.labelUrl || null,
            packedAt: new Date().toISOString(),
          });
          toast.success(
            data?.awb
              ? `AWB ${data.awb} generated and order dispatched via Shiprocket!`
              : "Order dispatched via Shiprocket!"
          );
        },
        onError: (err: any) => {
          setErrorMessage(
            err.response?.data?.message || err.message || "Failed to dispatch via Shiprocket"
          );
        },
      }
    );
  };

  const handleConfirmPacked = () => {
    setErrorMessage(null);

    const finalAwb = awbNumber.trim();
    if (!finalAwb) {
      const msg = "Please enter or scan the courier AWB tracking barcode.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    let trackingUrl = `https://shiprocket.co/tracking/${finalAwb}`;
    if (selectedCourier.id === "xpressbees") {
      trackingUrl = `https://www.xpressbees.com/shipment/tracking/${finalAwb}`;
    } else if (selectedCourier.id === "delhivery") {
      trackingUrl = `https://www.delhivery.com/track/package/${finalAwb}`;
    }

    createManualMutation.mutate(
      {
        orderId,
        courierName: selectedCourier.name,
        awb: finalAwb,
        trackingUrl,
      },
      {
        onSuccess: (data: any) => {
          setCreatedShipment({
            ...data,
            courierName: selectedCourier.name,
            awb: finalAwb,
            trackingUrl,
            packedAt: new Date().toISOString(),
          });
          toast.success(`Order marked as packed & assigned to ${selectedCourier.name}!`);
        },
        onError: (err: any) => {
          setErrorMessage(err.response?.data?.message || err.message || "Failed to confirm shipment");
        },
      }
    );
  };

  const orderNum = order?.orderNumber || orderId;
  const isCod = order?.paymentMethod?.toLowerCase() === "cod";
  const isPaymentFailed = order?.status === "failed";
  const isPendingPayment = order?.status === "pending_payment";
  const isCancelled = order?.status === "cancelled";
  const isUnsettled = isPaymentFailed || isPendingPayment || isCancelled;

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand/10 text-brand">
              <TruckIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pack &amp; Dispatch Order #{orderNum}
              </h2>
              <p className="text-xs text-slate-500">
                Assign pickup warehouse, package dimensions, and courier partner for dispatch
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {isOrderLoading ? (
            <div className="space-y-4 py-8">
              <div className="h-20 bg-slate-100 w-full rounded-xl animate-pulse" />
              <div className="h-32 bg-slate-100 w-full rounded-xl animate-pulse" />
            </div>
          ) : !order ? (
            <div className="text-red-500 text-center py-10 font-bold">Order not found.</div>
          ) : createdShipment ? (
            /* SUCCESS VIEW */
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {createdShipment.awb
                    ? "Order Dispatched & AWB Assigned!"
                    : "Order Packed & Dispatched via Shiprocket!"}
                </h3>
                <p className="text-slate-500 mt-1 text-xs max-w-sm mx-auto">
                  Package registered at {format(new Date(createdShipment.packedAt || Date.now()), "dd MMM, hh:mm a")}. Handover scheduled via {createdShipment.courierName || "Courier Partner"}.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 w-full text-left rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Courier Partner</span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">{createdShipment.courierName || "Shiprocket"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tracking AWB</span>
                    <p className="font-mono text-sm font-bold text-brand mt-0.5">
                      {createdShipment.awb || "Generated via API"}
                    </p>
                  </div>
                </div>

                {createdShipment.awb && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-start">
                    <button
                      type="button"
                      onClick={() => setShowTrackingModal(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                    >
                      <TruckIcon className="w-4 h-4 text-blue-600" />
                      <span>View Live Status in Modal</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (createdShipment.labelUrl) {
                      window.open(createdShipment.labelUrl, "_blank");
                    } else {
                      setShowLabelModal(true);
                    }
                  }}
                  className="w-full py-2.5 bg-neutral-900 hover:bg-brand text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <PrinterIcon className="w-4 h-4" />
                  <span>Print 4×6″ Shipping Label</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors border border-slate-200"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          ) : (
            /* CLEAN FULFILLMENT FORM */
            <>
              {/* Warning if payment is unsettled */}
              {isUnsettled && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-900">
                    <span>⚠️ Payment Not Verified</span>
                  </div>
                  <p>
                    {isPaymentFailed
                      ? "The payment transaction for this order failed. Do not pack or dispatch this order."
                      : "Payment is pending at the gateway. Wait until funds are confirmed before dispatching."}
                  </p>
                </div>
              )}

              {/* Order Destination & Items Summary */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 text-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-slate-400 font-bold block">Customer Destination</span>
                      {order.shippingAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            const fullAddr = [
                              order.shippingAddress?.fullName,
                              order.shippingAddress?.phone ? `Phone: ${order.shippingAddress.phone}` : null,
                              [order.shippingAddress?.addressLine1, order.shippingAddress?.addressLine2 || order.shippingAddress?.street].filter(Boolean).join(", "),
                              `${order.shippingAddress?.city}, ${order.shippingAddress?.state} - ${order.shippingAddress?.pincode}`,
                              order.shippingAddress?.country || "India"
                            ].filter(Boolean).join("\n");
                            navigator.clipboard.writeText(fullAddr);
                            toast.success("Full address copied to clipboard!");
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 font-semibold"
                          title="Copy full address"
                        >
                          <ClipboardDocumentIcon className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 block mt-0.5">
                      {order.shippingAddress?.fullName} ({order.shippingAddress?.phone})
                    </span>
                    {(order.shippingAddress?.addressLine1 || order.shippingAddress?.street) && (
                      <span className="text-slate-700 block mt-0.5 font-medium leading-relaxed">
                        {[order.shippingAddress?.addressLine1, order.shippingAddress?.addressLine2 || order.shippingAddress?.street].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                      <MapPinIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.pincode})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Payment &amp; Amount</span>
                    <div className="mt-1 flex flex-col gap-1">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {formatPrice(order.pricing?.total || 0)}
                      </span>
                      {isCod ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 w-fit">
                          COD • Collect {formatPrice(order.pricing?.codAmountToCollect || order.pricing?.total || 0)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 w-fit">
                          PREPAID (Paid in Full)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {(() => {
                  const totalUnits = (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
                  const distinctCount = order.items?.length || 0;

                  return (
                    <div className="pt-2.5 border-t border-slate-200/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase text-slate-500 font-bold block">
                          Items to Pack &amp; Inspect
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[10px] font-mono shadow-xs">
                            {totalUnits} {totalUnits === 1 ? "Unit" : "Units Total"}
                          </span>
                          {distinctCount > 1 && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              ({distinctCount} Products)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {order.items?.map((item: any, idx: number) => {
                          const imgUrl = item.image || item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg";
                          const qty = item.quantity || 1;

                          return (
                            <div 
                              key={item.productId + (item.variantId || "") + idx}
                              className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-10 h-10 bg-slate-50 border border-slate-200 rounded-md shrink-0 overflow-hidden p-0.5">
                                  <Image
                                    src={imgUrl}
                                    alt={item.name || "Product"}
                                    fill
                                    className="object-contain"
                                    sizes="40px"
                                  />
                                  <div className="absolute top-0.5 left-0.5 bg-slate-900/90 text-white font-mono font-bold text-[8px] px-1 rounded">
                                    #{idx + 1}
                                  </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-slate-900 text-xs truncate block" title={item.name}>
                                    {item.name}
                                  </span>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                                    <span>SKU: {item.sku || "N/A"}</span>
                                    {item.variantId && <span>• {item.variantId}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center">
                                <span className="px-2 py-1 rounded bg-amber-500 text-white font-black text-xs font-mono shadow-xs">
                                  {qty} {qty === 1 ? "PC" : "PCS"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Step 1: Select Courier Partner */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  1. Select Courier Partner
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {COURIER_PARTNERS.map((courier) => {
                    const isSelected = selectedCourierId === courier.id;
                    return (
                      <button
                        key={courier.id}
                        type="button"
                        onClick={() => setSelectedCourierId(courier.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? `${courier.color} ring-2 ring-brand font-bold shadow-sm`
                            : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black">{courier.name}</div>
                          <div className="text-[10px] opacity-75 mt-0.5 leading-tight">{courier.badge}</div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-black uppercase text-brand mt-2 block">✓ Selected</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Pickup Warehouse & Packaging Specifications */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BuildingStorefrontIcon className="w-4 h-4 text-brand" />
                    <span>2. Pickup Warehouse &amp; Packaging Specs</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Configured for Shiprocket &amp; Logistics</span>
                </div>

                {/* Warehouse Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>Pickup Warehouse Location <span className="text-red-500">*</span></span>
                    <span className="text-[10px] font-normal text-slate-500">Where courier will pick up parcel</span>
                  </label>
                  {isWarehousesLoading ? (
                    <div className="h-9 bg-slate-200 animate-pulse rounded-lg" />
                  ) : warehouses.length === 0 ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      No warehouses found. Please add a warehouse in Settings &gt; Logistics.
                    </div>
                  ) : (
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 bg-white focus:outline-none focus:border-brand shadow-xs"
                    >
                      {warehouses.filter((w) => w.isActive !== false).map((w: any) => {
                        const wId = String(w._id || w.id);
                        const srNick = w.shiprocketLocationId ? ` • Shiprocket Nickname: "${w.shiprocketLocationId}"` : "";
                        return (
                          <option key={wId} value={wId}>
                            {w.name} — {w.city}, {w.state} ({w.pincode}){w.isDefault ? " [Default]" : ""}{srNick}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {(() => {
                    const selectedWh = warehouses.find((w: any) => String(w._id || w.id) === selectedWarehouseId);
                    if (selectedWh && !selectedWh.shiprocketLocationId && selectedCourierId === "shiprocket") {
                      return (
                        <p className="text-[11px] text-amber-600 font-medium">
                          ⚠️ Note: &quot;{selectedWh.name}&quot; does not have a Shiprocket Location Nickname set. Shiprocket will fall back to your primary pickup address or pincode ({selectedWh.pincode}).
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Dead Weight and Package Dimensions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Weight (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={packageWeight}
                      onChange={(e) => setPackageWeight(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-brand shadow-xs"
                      placeholder="1.0"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Length (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({ ...dimensions, length: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-brand shadow-xs"
                      placeholder="15"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Breadth (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={dimensions.breadth}
                      onChange={(e) => setDimensions({ ...dimensions, breadth: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-brand shadow-xs"
                      placeholder="15"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Height (cm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({ ...dimensions, height: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:border-brand shadow-xs"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Volumetric & Billable Weight Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <ScaleIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Volumetric:</span>
                    <span className="font-mono font-semibold text-slate-800">{volumetricWeight} kg</span>
                    <span className="text-[10px] text-slate-400">((L×B×H)/5000)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Billable Weight:</span>
                    <span className="font-mono font-black text-brand text-xs px-2 py-0.5 rounded bg-brand/10">
                      {billableWeight} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: AWB Tracking Barcode (Manual Couriers only) */}
              {selectedCourierId !== "shiprocket" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    3. AWB Tracking Barcode <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={awbNumber}
                      onChange={(e) => setAwbNumber(e.target.value)}
                      placeholder="Enter or scan courier waybill barcode from label..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-brand bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Scan the physical package barcode or paste the AWB assigned by {selectedCourier.name}.
                  </p>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                  {errorMessage}
                </div>
              )}

              {/* Primary Action Button */}
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                {selectedCourierId === "shiprocket" ? (
                  <button
                    type="button"
                    disabled={pushToShiprocketMutation.isPending || isUnsettled}
                    onClick={handlePushToShiprocket}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <TruckIcon className="w-4 h-4" />
                    <span>
                      {pushToShiprocketMutation.isPending
                        ? "Generating AWB via Shiprocket..."
                        : "Dispatch & Generate AWB via Shiprocket"}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={createManualMutation.isPending || isUnsettled}
                    onClick={handleConfirmPacked}
                    className="w-full py-3 bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    <span>
                      {createManualMutation.isPending
                        ? "Confirming Packaging..."
                        : `Confirm Packed & Dispatch with ${selectedCourier.name}`}
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4x6 Thermal Shipping Label Modal */}
      {showLabelModal && (
        <ShippingLabelModal
          order={{
            ...order,
            shipment: {
              ...createdShipment,
              courierName: createdShipment.courierName,
              awb: createdShipment.awb,
              trackingUrl: createdShipment.trackingUrl,
            },
          }}
          onClose={() => setShowLabelModal(false)}
        />
      )}

      {/* Live Carrier Tracking Modal */}
      {showTrackingModal && (
        <AdminTrackingModal
          order={{
            ...order,
            shipment: {
              ...createdShipment,
              courierName: createdShipment.courierName,
              awb: createdShipment.awb,
              trackingUrl: createdShipment.trackingUrl,
            },
          }}
          onClose={() => setShowTrackingModal(false)}
        />
      )}
    </div>,
    document.body
  );
};
