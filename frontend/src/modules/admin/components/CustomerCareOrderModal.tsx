"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { formatPrice } from "@store4riders/shared-utils";
import { 
  XMarkIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ChatBubbleLeftRightIcon,
  ArrowTopRightOnSquareIcon,
  TruckIcon,
  ClipboardDocumentIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useOrderShipments } from "@/core/hooks/useShipments";
import { useAdminAddOrderNote, useAdminUpdateOrderStatus } from "@/core/hooks/useAdminOrders";
import { useAdminOrderById } from "@/core/hooks/useOrderById";
import { useGenerateInvoice } from "@/core/hooks/useOrderActions";
import { apiClient } from "@/core/api/client";
import { OrderItemGalleryModal } from "@/modules/admin-orders/components/OrderItemGalleryModal";
import { AdminOrderDetailModule } from "@/modules/admin-orders/components/AdminOrderDetailModule";

interface CustomerCareOrderModalProps {
  order: any;
  onClose: () => void;
}

const STAGES = [
  { step: 1, name: "Order Placed", shortDesc: "Confirmed in Store" },
  { step: 2, name: "Packed & AWB Assigned", shortDesc: "Manifested at Warehouse" },
  { step: 3, name: "In Transit", shortDesc: "Hub Transit Network" },
  { step: 4, name: "Out for Delivery", shortDesc: "With Delivery Executive" },
  { step: 5, name: "Delivered", shortDesc: "Delivered to Customer" },
];

export const CustomerCareOrderModal: React.FC<CustomerCareOrderModalProps> = ({ order: initialOrder, onClose }) => {
  const [internalNote, setInternalNote] = useState("");
  const [isSyncingTracking, setIsSyncingTracking] = useState(false);
  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);
  const [isFullOrderFileOpen, setIsFullOrderFileOpen] = useState(false);

  const addNoteMutation = useAdminAddOrderNote();
  const updateStatusMutation = useAdminUpdateOrderStatus();
  const generateInvoiceMutation = useGenerateInvoice();

  const orderId = initialOrder?.id || initialOrder?._id || "";
  
  // Fetch fresh populated order details from admin endpoint (guarantees images, full customer details, notes)
  const { data: fetchedOrder, refetch: refetchOrder } = useAdminOrderById(orderId);
  const order = fetchedOrder || initialOrder;

  // Real-time shipments with webhook tracking events
  const { data: shipments = [], refetch: refetchShipments, isLoading: isShipmentsLoading } = useOrderShipments(orderId);

  if (!order) return null;

  const orderNum = order.orderNumber || order.id || order._id;
  const customerName = order.shippingAddress?.fullName || order.customer?.fullName || [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || order.customer?.name || "Guest Customer";
  const customerPhone = order.shippingAddress?.phone || order.customer?.phone || "";
  const customerEmail = order.customerEmail || order.guestEmail || order.customer?.email || "";
  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  const address = order.shippingAddress ? [
    order.shippingAddress?.addressLine1,
    order.shippingAddress?.addressLine2 || order.shippingAddress?.street,
    order.shippingAddress?.city,
    order.shippingAddress?.state,
    order.shippingAddress?.pincode,
    order.shippingAddress?.country || "India",
  ].filter(Boolean).join(", ") : [
    order.customer?.addressLine1,
    order.customer?.addressLine2 || order.customer?.street,
    order.customer?.city,
    order.customer?.state,
    order.customer?.pincode,
    order.customer?.country || "India",
  ].filter(Boolean).join(", ");

  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
  const rawTotal = order.pricing?.total ?? order.totalAmount ?? order.total ?? 0;
  const subtotal = order.pricing?.subtotal ?? order.subtotal ?? rawTotal;
  const discount = order.pricing?.discount ?? order.discount ?? 0;
  const tax = order.pricing?.tax ?? order.tax ?? 0;
  const shippingCharge = order.pricing?.shipping ?? order.shippingFee ?? 0;
  const isFailed = order.status === "failed";
  const isPendingPayment = order.status === "pending_payment";
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  // Financial pending calculation
  let financialStatusTitle = "Prepaid Order (Paid Online)";
  let financialStatusDesc = `100% payment of ${formatPrice(rawTotal)} captured successfully. Zero balance pending.`;
  let financialStatusColor = "bg-emerald-50 text-emerald-900 border-emerald-200";
  let dueAmount = 0;

  if (isCod) {
    if (isDelivered) {
      financialStatusTitle = "Cash on Delivery (Collected)";
      financialStatusDesc = `COD collection of ${formatPrice(rawTotal)} completed upon delivery.`;
      financialStatusColor = "bg-emerald-50 text-emerald-900 border-emerald-200";
    } else if (isCancelled) {
      financialStatusTitle = "COD Order Cancelled";
      financialStatusDesc = "Order cancelled before fulfillment. No collection pending.";
      financialStatusColor = "bg-slate-50 text-slate-800 border-slate-200";
    } else {
      dueAmount = rawTotal;
      financialStatusTitle = "Cash on Delivery (Pending Collection)";
      financialStatusDesc = `${formatPrice(rawTotal)} to be collected from customer by courier delivery partner upon doorstep delivery.`;
      financialStatusColor = "bg-amber-50 text-amber-900 border-amber-200";
    }
  } else if (isFailed || isPendingPayment) {
    dueAmount = rawTotal;
    financialStatusTitle = "Payment Incomplete / Abandoned";
    financialStatusDesc = `Customer abandoned or experienced an issue during checkout payment gateway step. Amount pending: ${formatPrice(rawTotal)}.`;
    financialStatusColor = "bg-rose-50 text-rose-900 border-rose-200";
  } else if (order.status === "refunded") {
    financialStatusTitle = "Order Refunded";
    financialStatusDesc = `Full payment of ${formatPrice(rawTotal)} was refunded to customer original payment source.`;
    financialStatusColor = "bg-purple-50 text-purple-900 border-purple-200";
  }

  const latestShipment = shipments && shipments.length > 0 ? shipments[0] : null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleAddNote = () => {
    if (!internalNote.trim()) return;
    addNoteMutation.mutate(
      { orderId, text: internalNote.trim() },
      {
        onSuccess: () => {
          setInternalNote("");
          refetchOrder();
          toast.success("Customer Care note saved to order history");
        },
      }
    );
  };

  const handleSyncCourier = async (shipmentId?: string) => {
    if (!shipmentId) return;
    try {
      setIsSyncingTracking(true);
      await apiClient.post(`/shipments/admin/${shipmentId}/sync`);
      await refetchShipments();
      await refetchOrder();
      toast.success("Live courier tracking synced with carrier portal");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to sync tracking with courier");
    } finally {
      setIsSyncingTracking(false);
    }
  };

  const handleWhatsAppCustomer = () => {
    if (!customerPhone) {
      toast.error("Customer phone number is missing");
      return;
    }
    let msg = `*Store4Riders Customer Care*\n\n`;
    msg += `Hello *${customerName}*,\n`;
    msg += `This is regarding your Order *#${orderNum}* on Store4Riders.\n\n`;
    msg += `📦 *Order Status:* ${order.status.replace(/_/g, " ").toUpperCase()}\n`;
    if (latestShipment?.awb) {
      msg += `🚚 *Courier:* ${latestShipment.courierName || latestShipment.provider?.toUpperCase() || "Courier Partner"}\n`;
      msg += `📍 *Tracking AWB:* ${latestShipment.awb}\n`;
      if (latestShipment.trackingUrl) {
        msg += `🔗 *Live Tracking Link:* ${latestShipment.trackingUrl}\n`;
      }
    }
    msg += `💰 *Order Total:* ${formatPrice(rawTotal)}\n`;
    if (isCod) {
      msg += `💵 *Payment Mode:* Cash on Delivery (Due: ${formatPrice(dueAmount)})\n`;
    } else if (isFailed || isPendingPayment) {
      msg += `⚠️ *Payment Status:* Payment was pending or incomplete. Please let us know if you need assistance completing your order.\n`;
    } else {
      msg += `💳 *Payment Mode:* Paid Online (${order.paymentMethod || "Prepaid"})\n`;
    }
    msg += `\nPlease reply to this message if you have any questions or require any assistance. We are happy to help!\n\nStore4Riders Support Team`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleCancelOrder = () => {
    if (!confirm(`Are you sure you want to cancel order #${orderNum} as requested by the customer?`)) return;
    updateStatusMutation.mutate(
      { orderId, status: "cancelled" },
      {
        onSuccess: () => {
          toast.success(`Order #${orderNum} cancelled successfully`);
          refetchOrder();
        },
      }
    );
  };

  const getTrackingStage = (status?: string, events?: any[]) => {
    const s = (status || "").toUpperCase();
    const latestEvent = events && events.length > 0 ? events[0] : null;
    const evStatus = (latestEvent?.status || latestEvent?.providerStatus || "").toUpperCase();

    if (s.includes("DELIVERED") || evStatus.includes("DELIVERED")) {
      return {
        step: 5,
        name: "Delivered",
        desc: "Package successfully delivered to customer doorstep.",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      };
    }

    if (s.includes("OUT_FOR_DELIVERY") || evStatus.includes("OUT FOR DELIVERY") || evStatus.includes("OUT_FOR_DELIVERY")) {
      return {
        step: 4,
        name: "Out for Delivery",
        desc: "Package is with courier delivery executive for doorstep delivery today.",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      };
    }

    if (
      s.includes("IN_TRANSIT") || 
      s.includes("TRANSIT") || 
      s.includes("SHIPPED") || 
      s.includes("PICKED") ||
      evStatus.includes("TRANSIT") ||
      evStatus.includes("PICKED")
    ) {
      return {
        step: 3,
        name: "In Transit",
        desc: latestEvent?.location 
          ? `Package in transit via courier network (Current Hub: ${latestEvent.location}).`
          : "Package in transit moving through courier hub network.",
        badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
      };
    }

    if (
      s.includes("AWB") || 
      s.includes("READY") || 
      s.includes("CREATED") || 
      s.includes("PACKED") ||
      evStatus.includes("AWB")
    ) {
      return {
        step: 2,
        name: "Packed & AWB Assigned",
        desc: "Shipment manifested & AWB assigned. Package packed at warehouse and ready for carrier pickup scan.",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      };
    }

    return {
      step: 1,
      name: "Order Confirmed",
      desc: "Order confirmed in store system. Warehouse preparing items for packaging.",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-3 sm:p-6">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand/10 text-brand">
              <TruckIcon className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-lg">Order #{orderNum}</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-200 text-slate-700">
                  {order.status.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-slate-400">
                  • {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy, hh:mm a") : ""}
                </span>
              </div>
              <p className="text-xs text-slate-500">Customer Care Order Summary &amp; Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(orderNum, "Order Number")}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
              title="Copy Order #"
            >
              <ClipboardDocumentIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto overscroll-contain space-y-6 [will-change:scroll-position]">
          
          {/* Quick Action Ribbon for Customer Care */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppCustomer}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>WhatsApp Customer</span>
              </button>
              {customerPhone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <PhoneIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call {customerPhone}</span>
                </a>
              )}
              {customerEmail && (
                <a
                  href={`mailto:${customerEmail}?subject=Store4Riders Order %23${orderNum}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  <EnvelopeIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email</span>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => generateInvoiceMutation.mutate(orderId)}
                disabled={generateInvoiceMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="w-3.5 h-3.5 text-brand" />
                <span>{generateInvoiceMutation.isPending ? "Generating..." : "Download Invoice"}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullOrderFileOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                title="Open comprehensive full order file in modal"
              >
                <ClipboardDocumentIcon className="w-3.5 h-3.5 text-slate-300" />
                <span>Full Order File</span>
              </button>
            </div>
          </div>

          {/* Section 1: Financial & Paisa Status Card */}
          <div className={`p-4 rounded-xl border ${financialStatusColor}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isCod ? <BanknotesIcon className="w-5 h-5 text-amber-600" /> : <CreditCardIcon className="w-5 h-5 text-emerald-600" />}
                  <span>{financialStatusTitle}</span>
                </div>
                <p className="text-xs mt-1 opacity-90">{financialStatusDesc}</p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs uppercase font-bold tracking-wider opacity-75">Order Total</div>
                <div className="text-xl font-black">{formatPrice(rawTotal)}</div>
                {dueAmount > 0 && (
                  <div className="text-xs font-bold text-rose-600 mt-0.5">
                    Pending Due: {formatPrice(dueAmount)}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Details Grid */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Subtotal</span>
                <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tax / GST</span>
                <span className="font-semibold text-slate-800">{formatPrice(tax)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Shipping Charge</span>
                <span className="font-semibold text-slate-800">{shippingCharge > 0 ? formatPrice(shippingCharge) : "FREE"}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Discount</span>
                <span className="font-semibold text-emerald-600">{discount > 0 ? `-${formatPrice(discount)}` : "None"}</span>
              </div>
              {Boolean(order.pricing?.couponDiscount && order.pricing.couponDiscount > 0) && (
                <div>
                  <span className="text-slate-500 block">Promo Coupon ({order.pricing?.couponCode})</span>
                  <span className="font-semibold text-emerald-600">-{formatPrice(order.pricing?.couponDiscount || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: User Full Details & Address Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Contact & Identity */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-4 h-4 text-brand" />
                  <span>Customer Information</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {order.userId ? "Registered Account" : "Guest Checkout"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm">{customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone Number</span>
                    <span className="font-semibold text-slate-800">{customerPhone || "Not provided"}</span>
                  </div>
                  {customerPhone && (
                    <button
                      onClick={() => handleCopy(customerPhone, "Phone number")}
                      className="text-xs text-brand hover:underline font-semibold"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-slate-800">{customerEmail || "Not provided"}</span>
                  </div>
                  {customerEmail && (
                    <button
                      onClick={() => handleCopy(customerEmail, "Email address")}
                      className="text-xs text-brand hover:underline font-semibold"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address Snapshot */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-brand" />
                  <span>Shipping Address</span>
                </h4>
                {address && (
                  <button
                    onClick={() => handleCopy(address, "Full shipping address")}
                    className="text-xs text-brand hover:underline font-semibold"
                  >
                    Copy Address
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {address || "No shipping address details found for this order."}
              </p>

              {order.shippingAddress?.pincode && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Destination Pincode:</span>
                  <span className="font-bold text-slate-900">{order.shippingAddress.pincode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Live Courier Logistics, Stepper & In-Modal Carrier Tracking */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TruckIcon className="w-4 h-4 text-brand" />
                  <span>Live Courier Status &amp; Tracking Lifecycle</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time shipping progress, warehouse handover, hub checkpoints, and carrier portal view.
                </p>
              </div>

              {latestShipment && (
                <button
                  onClick={() => handleSyncCourier(latestShipment._id || latestShipment.id)}
                  disabled={isSyncingTracking}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors disabled:opacity-50 shadow-2xs"
                  title="Sync latest tracking from carrier portal"
                >
                  <ArrowPathIcon className={`w-3.5 h-3.5 text-brand ${isSyncingTracking ? "animate-spin" : ""}`} />
                  <span>{isSyncingTracking ? "Syncing..." : "Sync Live Carrier"}</span>
                </button>
              )}
            </div>

            {shipments && shipments.length > 0 ? (
              <div className="space-y-4">
                {shipments.map((shipment: any, sIdx: number) => {
                  const stage = getTrackingStage(shipment.status, shipment.events);
                  const latestCheckpoint = shipment.events && shipment.events.length > 0 ? shipment.events[0] : null;

                  return (
                    <div key={shipment._id || sIdx} className="space-y-3">
                      {/* Shipment Header Card */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-brand shrink-0">
                            <TruckIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 text-sm block">
                              {shipment.courierName || (shipment.provider && shipment.provider !== "manual" ? shipment.provider.toUpperCase() : "Carrier Partner")}
                            </span>
                            {shipment.provider && shipment.provider !== "manual" && (
                              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                Service: {shipment.provider}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">AWB:</span>
                          <span className="font-mono font-bold text-slate-900">{shipment.awb || "Pending Assignment"}</span>
                          {shipment.awb && (
                            <button
                              onClick={() => handleCopy(shipment.awb, "AWB")}
                              className="text-brand hover:text-brand/80 p-0.5"
                              title="Copy AWB"
                            >
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Courier Status</span>
                          <span className="font-bold uppercase text-brand">{shipment.status?.replace(/_/g, " ")}</span>
                        </div>
                      </div>

                      {/* Visual 5-Stage Stepper: Exact Location & Progress in "Shipped" Lifecycle */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                          <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <TruckIcon className="w-4 h-4 text-brand" />
                            <span>Transit Journey Lifecycle</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${stage.badgeColor}`}>
                            Stage: {stage.name}
                          </span>
                        </div>

                        {/* Progress Line and Circular Nodes */}
                        <div className="py-2">
                          <div className="relative h-8 flex items-center">
                            {/* Connecting track running precisely through the centers of 32px (h-8) circle nodes */}
                            <div className="absolute top-1/2 left-[10%] right-[10%] -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full">
                              <div 
                                className="h-full bg-brand rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(0, Math.min(100, ((stage.step - 1) / 4) * 100))}%` }}
                              />
                            </div>

                            <div className="relative z-10 w-full flex items-center justify-between">
                              {STAGES.map((st) => {
                                const isCompleted = stage.step > st.step;
                                const isCurrent = stage.step === st.step;

                                return (
                                  <div key={st.step} className="flex-1 flex justify-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                                      isCompleted 
                                        ? "bg-brand text-white" 
                                        : isCurrent 
                                        ? "bg-brand text-white ring-4 ring-brand/20 shadow-md font-black" 
                                        : "bg-white border-2 border-slate-300 text-slate-400"
                                    }`}>
                                      {isCompleted ? <CheckIcon className="w-4 h-4 stroke-[3]" /> : st.step}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Step Labels Row: Completely separate below the track, impossible to overlap text! */}
                          <div className="flex justify-between mt-2.5">
                            {STAGES.map((st) => {
                              const isCompleted = stage.step > st.step;
                              const isCurrent = stage.step === st.step;

                              return (
                                <div key={st.step} className="flex-1 flex flex-col items-center text-center px-1">
                                  <span className={`text-[10px] font-bold leading-tight ${
                                    isCurrent ? "text-brand font-black" : isCompleted ? "text-slate-900" : "text-slate-400"
                                  }`}>
                                    {st.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400 hidden sm:block mt-0.5 leading-tight">
                                    {st.shortDesc}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Real-Time Current Stage Description & Hub Location Banner */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-start gap-2">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${stage.step === 5 ? "bg-emerald-500" : "bg-brand ring-4 ring-brand/20"}`} />
                            <div>
                              <span className="font-bold text-slate-900 block">{stage.desc}</span>
                              <span className="text-[11px] text-slate-500">
                                Courier: <strong>{shipment.courierName || shipment.provider?.toUpperCase()}</strong> • AWB: <strong className="font-mono">{shipment.awb}</strong>
                              </span>
                            </div>
                          </div>
                          {latestCheckpoint?.location && (
                            <div className="text-left sm:text-right shrink-0 bg-white px-2.5 py-1 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Hub Scan</span>
                              <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                                <MapPinIcon className="w-3.5 h-3.5 text-brand shrink-0" />
                                <span>{latestCheckpoint.location}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Webhook Events Stream from Shiprocket, Delhivery, Xpressbees */}
                      {shipment.events && shipment.events.length > 0 ? (
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                            <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                              <ClockIcon className="w-3.5 h-3.5 text-brand" />
                              <span>Live Courier Tracking History ({shipment.events.length} Checkpoints)</span>
                            </span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                              Live Carrier Connected
                            </span>
                          </div>

                          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                            {shipment.events.map((ev: any, idx: number) => {
                              const isLatest = idx === 0;
                              return (
                                <div key={idx} className="flex items-start gap-2.5 text-xs">
                                  <div className="mt-1 flex flex-col items-center shrink-0">
                                    <span className={`w-2.5 h-2.5 rounded-full ${isLatest ? "bg-emerald-600 ring-4 ring-emerald-100" : "bg-slate-300"}`} />
                                    {idx < shipment.events.length - 1 && <span className="w-0.5 h-6 bg-slate-200 my-0.5" />}
                                  </div>
                                  <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                      <span className="font-bold text-slate-900">
                                        {ev.activity || ev.description || ev.status || ev.providerStatus}
                                      </span>
                                      {ev.provider && (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                                          {ev.provider}
                                        </span>
                                      )}
                                    </div>
                                    {ev.location && (
                                      <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                                        <MapPinIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{ev.location}</span>
                                      </div>
                                    )}
                                    <span className="text-slate-400 block text-[10px] mt-1">
                                      {ev.timestamp || ev.date ? format(new Date(ev.timestamp || ev.date), "dd MMM yyyy, hh:mm a") : ""}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                          <span>Shipment manifested with carrier. Awaiting first transit scan webhook.</span>
                          {shipment.awb && (
                            <button
                              onClick={() => handleSyncCourier(shipment._id || shipment.id)}
                              className="text-brand font-bold hover:underline"
                            >
                              Sync Now
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                <ClockIcon className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <span>No courier dispatch booked yet for this order. Current Status: <strong className="uppercase text-slate-800">{order.status}</strong></span>
              </div>
            )}
          </div>

          {/* Section 4: Ordered Products (Full Detail with Thumbnails, SKUs, and Variant Info) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBagIcon className="w-4 h-4 text-brand" />
                <span>Ordered Products ({order.items?.length || 0})</span>
              </h4>
              <span className="text-xs text-slate-500">
                Total Items: {order.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 0}
              </span>
            </div>

            {order.items && order.items.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {order.items.map((item: any, idx: number) => {
                  const itemTotal = (item.unitPrice || 0) * (item.quantity || 1);
                  const imgUrl = item.image || item.imageUrl || item.thumbnail;
                  const productName = item.name || item.title || "Rider Gear Product";

                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 bg-white hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Interactive Product Thumbnail with View Photos Badge */}
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryItem(item)}
                          className="relative w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand"
                          title="Click to view product photos, description and specs"
                        >
                          {imgUrl ? (
                            <Image 
                              src={imgUrl} 
                              alt={productName} 
                              fill 
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <ShoppingBagIcon className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <EyeIcon className="w-5 h-5" />
                          </div>
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedGalleryItem(item)}
                              className="font-bold text-xs sm:text-sm text-slate-900 hover:text-brand transition-colors text-left line-clamp-1 cursor-pointer"
                              title="Click to inspect product details"
                            >
                              {productName}
                            </button>
                            {item.slug && (
                              <Link 
                                href={`/products/${item.slug}`} 
                                target="_blank"
                                className="text-slate-400 hover:text-brand shrink-0" 
                                title="Open storefront product page"
                              >
                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                            {item.sku && (
                              <span className="inline-flex items-center gap-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                <span>SKU: {item.sku}</span>
                                <button 
                                  onClick={() => handleCopy(item.sku, "SKU")}
                                  className="text-slate-400 hover:text-brand" 
                                  title="Copy SKU"
                                >
                                  <ClipboardDocumentIcon className="w-3 h-3" />
                                </button>
                              </span>
                            )}
                            {(item.variantAttributes?.size || item.size) && (
                              <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                                Size: {item.variantAttributes?.size || item.size}
                              </span>
                            )}
                            {(item.variantAttributes?.color || item.color) && (
                              <span className="font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                                Color: {item.variantAttributes?.color || item.color}
                              </span>
                            )}
                            {item.hsnCode && (
                              <span className="text-slate-400">
                                HSN: {item.hsnCode}
                              </span>
                            )}
                            <span className="font-bold text-slate-900">
                              Qty: {item.quantity}
                            </span>
                          </div>

                          {/* Quick Action to Open Description & Images Modal */}
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedGalleryItem(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand hover:text-brand/80 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              <span>View Description, Images &amp; Specs</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 text-xs sm:text-sm">{formatPrice(itemTotal)}</span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-slate-400 block">
                            ({formatPrice(item.unitPrice)} ea)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                <ShoppingBagIcon className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                <span>No individual product line items recorded for this transaction.</span>
              </div>
            )}
          </div>

          {/* Section 5: Customer Care Notes & Actions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Customer Support Logs &amp; Internal Notes
            </h4>

            {order.notes && order.notes.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto mb-3">
                {order.notes.map((n: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                    <p className="text-slate-800 font-medium">{n.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      By {n.author || "Staff"} • {n.timestamp ? format(new Date(n.timestamp), "dd MMM, hh:mm a") : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type customer call summary or support note..."
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand"
              />
              <button
                onClick={handleAddNote}
                disabled={!internalNote.trim() || addNoteMutation.isPending}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                {addNoteMutation.isPending ? "Saving..." : "Add Note"}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {!["cancelled", "delivered", "refunded"].includes(order.status) && (
              <button
                onClick={handleCancelOrder}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline"
              >
                Cancel Order (Customer Request)
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>

      {/* Product Description, Images & Specs Inspection Modal */}
      {selectedGalleryItem && (
        <OrderItemGalleryModal
          item={selectedGalleryItem}
          onClose={() => setSelectedGalleryItem(null)}
        />
      )}

      {/* Full Administrative Order Dossier Modal */}
      {isFullOrderFileOpen && (
        <AdminOrderDetailModule
          orderId={orderId}
          isModal={true}
          onClose={() => setIsFullOrderFileOpen(false)}
        />
      )}
    </div>
  );
};
