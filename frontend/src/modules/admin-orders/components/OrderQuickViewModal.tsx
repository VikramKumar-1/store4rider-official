"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
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
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  PhotoIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { OrderItemGalleryModal } from "./OrderItemGalleryModal";

interface OrderQuickViewModalProps {
  order: any;
  onClose: () => void;
  hideFinancials?: boolean;
}

export const OrderQuickViewModal: React.FC<OrderQuickViewModalProps> = ({ order, onClose, hideFinancials = false }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedGalleryItem, setSelectedGalleryItem] = useState<any | null>(null);

  if (!mounted || typeof document === "undefined" || !order) return null;

  const orderNum = order.orderNumber || order.id || order._id;
  const customerName = order.shippingAddress?.fullName || order.customer?.fullName || "Guest Customer";
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

  const isPaymentFailed = order.status === "failed";
  const isPendingPayment = order.status === "pending_payment";
  const isCancelled = order.status === "cancelled";
  const isUnsettled = isPaymentFailed || isPendingPayment || isCancelled;

  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
  const rawTotal = order.pricing?.total ?? order.totalAmount ?? order.total ?? order.codAmountToCollect ?? 0;
  const total = formatPrice(rawTotal);
  const dueOnDelivery = isCod && !isUnsettled ? formatPrice(order.pricing?.codAmountToCollect ?? order.codAmountToCollect ?? rawTotal) : null;

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleWhatsApp = () => {
    if (!customerPhone) return;
    let msg = `*Store4Riders — Order Details*\n\n`;
    msg += `Hello *${customerName}*,\n`;
    msg += `Thank you for your order *#${orderNum}* on Store4Riders.\n\n`;
    msg += `📦 *Order Items:*\n`;
    order.items?.forEach((i: any) => {
      const priceText = typeof i.unitPrice === "number" && i.unitPrice > 0 ? ` (${formatPrice(i.unitPrice * i.quantity)})` : "";
      msg += `• ${i.quantity}x ${i.name}${priceText}\n`;
    });
    msg += `\n💰 *Total Amount:* ${total}\n`;
    if (isPaymentFailed || isPendingPayment) {
      msg += `⚠️ *Payment Status:* Payment was not completed at checkout.\n`;
      msg += `If you faced any issue while paying online, please reply to this message and our support team will assist you!\n`;
    } else if (isCod) {
      msg += `💵 *Payment Mode:* Cash on Delivery (Due: ${dueOnDelivery})\n`;
    } else {
      msg += `💳 *Payment Mode:* Prepaid (Paid Online)\n`;
    }
    msg += `\n📍 *Delivery Address:*\n${address || "Customer Address"}\n\n`;
    msg += `If you need any assistance, feel free to reply to this message!`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return { label: "Delivered", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "shipped":
        return { label: "Shipped / In Transit", bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "packed":
        return { label: "Packed (Ready)", bg: "bg-indigo-100 text-indigo-800 border-indigo-200" };
      case "processing":
      case "confirmed":
        return { label: "New Order (To Pack)", bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "cancelled":
        return { label: "Cancelled", bg: "bg-red-100 text-red-800 border-red-200" };
      case "failed":
        return { label: "Payment Failed", bg: "bg-red-100 text-red-800 border-red-200" };
      case "return_requested":
        return { label: "Exchange Requested", bg: "bg-orange-100 text-orange-800 border-orange-200" };
      case "return_approved":
        return { label: "Exchange Approved", bg: "bg-purple-100 text-purple-800 border-purple-200" };
      default:
        return { label: status?.replace(/_/g, " ") || "Processing", bg: "bg-neutral-100 text-neutral-800 border-neutral-200" };
    }
  };

  const badge = getStatusBadge(order.status);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tight">
                  Order #{orderNum}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Placed on {order.createdAt ? format(new Date(order.createdAt), "MMMM dd, yyyy 'at' hh:mm a") : "Recently"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Customer Details Card */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Customer Details
                </span>
                <div className="flex items-center gap-1">
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={handleWhatsApp}
                      title="Chat on WhatsApp"
                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  {customerPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      title="Call customer"
                      className="p-1 border border-neutral-300 rounded bg-white text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      <PhoneIcon className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <div className="font-bold text-neutral-900 text-sm">{customerName}</div>
                {customerPhone && (
                  <div className="text-xs text-neutral-600 font-mono mt-0.5 flex items-center gap-1">
                    <span>📞 {customerPhone}</span>
                  </div>
                )}
                {customerEmail && (
                  <div className="text-xs text-neutral-500 mt-0.5">
                    ✉️ {customerEmail}
                  </div>
                )}
              </div>

              {/* Delivery Address */}
              <div className="pt-2 border-t border-neutral-200/80">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span>Shipping Address</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(address, "Address")}
                    className="text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                  >
                    <ClipboardDocumentIcon className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                  {address || "No address provided"}
                </p>
              </div>
            </div>

            {/* Payment & Courier Status Card */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                  Payment Summary
                </span>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isCod ? (
                      <BanknotesIcon className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CreditCardIcon className="w-5 h-5 text-emerald-600" />
                    )}
                    <span className="font-bold text-xs uppercase text-neutral-800">
                      {isCod ? "Cash on Delivery" : `Prepaid (${order.paymentMethod || "Online"})`}
                    </span>
                  </div>
                  <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                    isPaymentFailed
                      ? "bg-red-100 text-red-900 border border-red-200"
                      : isPendingPayment
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : isCancelled
                      ? "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      : isCod
                      ? "bg-amber-100 text-amber-900"
                      : "bg-emerald-100 text-emerald-900"
                  }`}>
                    {isPaymentFailed
                      ? "Payment Failed"
                      : isPendingPayment
                      ? "Awaiting Payment"
                      : isCancelled
                      ? "Cancelled"
                      : isCod
                      ? "Cash Due"
                      : "Paid in Full"}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal:</span>
                    <span>{formatPrice(order.pricing?.subtotal ?? (rawTotal - (order.pricing?.shipping || 0)))}</span>
                  </div>
                  {order.pricing?.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatPrice(order.pricing?.discount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-500">
                    <span>Shipping:</span>
                    <span>{order.pricing?.shipping === 0 ? "FREE" : formatPrice(order.pricing?.shipping || 0)}</span>
                  </div>
                  {order.pricing?.tax > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Tax:</span>
                      <span>{formatPrice(order.pricing?.tax || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-neutral-900 text-sm pt-1 border-t border-neutral-200">
                    <span>Total Amount:</span>
                    <span className="font-mono">{total}</span>
                  </div>
                  {isUnsettled ? (
                    <div className="flex justify-between text-red-700 font-bold text-xs pt-1 border-t border-neutral-200">
                      <span>Payment Status:</span>
                      <span>{isPaymentFailed ? "Failed / Declined" : isCancelled ? "Order Cancelled" : "Awaiting Gateway Capture"}</span>
                    </div>
                  ) : dueOnDelivery ? (
                    <div className="flex justify-between text-amber-800 font-bold text-xs pt-0.5">
                      <span>Collect from Customer:</span>
                      <span className="font-mono">{dueOnDelivery}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Courier info if available */}
              {(order.shipment || order.trackingNumber || order.awb) && (
                <div className="pt-2 border-t border-neutral-200/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">AWB Tracking:</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {order.awb || order.trackingNumber || "Assigned"}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Product Items Table */}
          {(() => {
            const totalUnits = (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
            const distinctProducts = order.items?.length || 0;

            return (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      Items to Pick &amp; Pack
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs font-mono shadow-sm">
                      {totalUnits} {totalUnits === 1 ? "Unit" : "Total Units"}
                    </span>
                    {distinctProducts > 1 && (
                      <span className="text-xs text-slate-300 font-medium">
                        • {distinctProducts} Different Products
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Click any item to view image gallery 📷
                  </span>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                  {order.items?.map((item: any, idx: number) => {
                    const imgUrl = item.image || item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg";
                    const qty = item.quantity || 1;
                    const unitPrice = typeof (item.unitPrice ?? item.price) === "number" ? (item.unitPrice ?? item.price) : 0;
                    const itemTotal = unitPrice * qty;
                    
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedGalleryItem(item)}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer transition-colors group"
                        title="Click to view image gallery & product details"
                      >
                        {/* Thumbnail & Product Description */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-xl p-1 shrink-0 overflow-hidden shadow-sm group-hover:border-brand transition-colors">
                            <Image
                              src={imgUrl}
                              alt={item.name || "Product"}
                              fill
                              className="object-contain p-0.5 group-hover:scale-105 transition-transform"
                              sizes="64px"
                            />
                            <div className="absolute top-1 left-1 bg-slate-900/90 text-white font-mono font-bold text-[9px] px-1 py-0.2 rounded">
                              #{idx + 1}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 text-sm group-hover:text-brand transition-colors flex items-center gap-1.5 line-clamp-1" title={item.name}>
                              <span>{item.name}</span>
                              <PhotoIcon className="w-4 h-4 text-slate-400 group-hover:text-brand shrink-0" />
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono flex-wrap">
                              <span>SKU: <strong className="text-slate-800">{item.sku || "N/A"}</strong></span>
                              {item.variantId && <span>• Variant: <strong className="text-slate-800">{item.variantId}</strong></span>}
                            </div>

                            <span className="text-[10px] text-brand font-bold uppercase tracking-wide group-hover:underline mt-1 block">
                              View Photos &amp; Specs ↗
                            </span>
                          </div>
                        </div>

                        {/* High-Visibility Quantity Badge & Price */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          {/* Big Bold Amber Quantity Pill */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Qty:
                            </span>
                            <span className="px-3 py-1 rounded-lg bg-amber-500 text-white font-black text-sm font-mono shadow-sm tracking-wide">
                              {qty} {qty === 1 ? "PC" : "PCS"}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="font-black text-slate-900 font-mono text-sm">
                              {formatPrice(itemTotal)}
                            </div>
                            {qty > 1 && (
                              <div className="text-xs text-slate-500 font-mono">
                                {qty} × {formatPrice(unitPrice)}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/80 flex items-center justify-between gap-3">
          <Link
            href={`/admin/orders/${order.id || order._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-neutral-700 hover:text-brand transition-colors"
          >
            <span>Open Full Order Page &amp; Invoice</span>
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3">
            {customerPhone && (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>WhatsApp Customer</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold uppercase transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Product Image Gallery & Specs Modal */}
      {selectedGalleryItem && (
        <OrderItemGalleryModal
          item={selectedGalleryItem}
          onClose={() => setSelectedGalleryItem(null)}
          hideFinancials={hideFinancials}
        />
      )}
    </div>,
    document.body
  );
};
