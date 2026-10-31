"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { formatPrice } from "@store4riders/shared-utils";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Receipt, 
  CreditCard, 
  Clock, 
  CheckCircle,
  MapPin,
  RefreshCw,
  Phone,
  FileText
} from "lucide-react";

export function OrderDetails({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/${orderId}`);
      return res.data;
    },
    enabled: !!orderId
  });

  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 w-full animate-pulse font-sans">
        <div className="h-4 w-32 bg-neutral-200 rounded mb-2" />
        <div className="h-8 w-64 bg-neutral-200 rounded mb-4" />
        <div className="h-28 bg-white border border-neutral-200 rounded-xl mb-4" />
        <div className="h-64 bg-white border border-neutral-200 rounded-xl" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="py-16 text-center bg-white border border-neutral-200 rounded-2xl p-6 font-sans">
        <div className="w-14 h-14 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Order Not Found</h2>
        <p className="text-xs text-neutral-500 mb-5">We couldn't find the details for this order reference.</p>
        <Link href="/account/orders">
          <button className="bg-brand text-white font-bold px-6 py-2.5 text-xs tracking-wider uppercase transition-colors rounded-lg">
            Back to Orders
          </button>
        </Link>
      </div>
    );
  }

  const order = data.data;

  // Status Stepper Logic
  const getStatusStepIndex = (status?: string): number => {
    switch (status?.toLowerCase()) {
      case "pending_payment":
        return 0;
      case "confirmed":
        return 0; // Placed & Confirmed -> Checkmark on Order Placed
      case "processing":
      case "packed":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentStatusIndex = getStatusStepIndex(order.status);
  const isCancelled = order.status?.toLowerCase() === "cancelled";
  const isFailed = order.status?.toLowerCase() === "failed";
  const isPendingPayment = order.status?.toLowerCase() === "pending_payment";

  const handleDownloadInvoice = async () => {
    try {
      setIsGeneratingInvoice(true);
      toast.loading("Generating tax invoice...", { id: "invoice" });
      const res = await apiClient.get(`/orders/${order._id || order.id}/invoice`);
      if (res.data?.data?.invoiceUrl) {
        window.open(res.data.data.invoiceUrl, "_blank");
        toast.success("Invoice opened in new tab!", { id: "invoice" });
      } else {
        toast.error("Failed to generate invoice", { id: "invoice" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error generating invoice", { id: "invoice" });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleSyncPayment = async () => {
    try {
      setIsCheckingStatus(true);
      const res = await apiClient.post("/orders/sync-payment", { orderId: order.orderNumber || order._id || order.id });
      const result = res.data?.data;
      if (result?.isConfirmed) {
        toast.success(result.message || "Payment verified with bank! Order confirmed.");
        window.location.reload();
      } else {
        setSyncMessage(result?.message || "Payment has not been captured yet by the gateway.");
        toast.info(result?.message || "Transaction not confirmed yet.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Could not check payment status.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col w-full font-sans pb-12">
      
      {/* 1. Back Navigation */}
      <Link 
        href="/account/orders" 
        className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-brand text-xs font-bold uppercase tracking-wider mb-4 transition-colors w-fit py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Orders</span>
      </Link>

      {/* 2. Top Header Card: Order ID, Date & Invoice */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-mono font-black text-lg sm:text-2xl text-neutral-900 tracking-tight">
              Order #{order.orderNumber || (order._id || order.id).slice(-8).toUpperCase()}
            </h1>
            {order.paymentMethod && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                {order.paymentMethod === "cod" ? "COD" : order.paymentMethod.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>Placed on {formattedDate}</span>
          </p>
        </div>

        {/* Invoice Button (Only if confirmed/delivered) */}
        {!isCancelled && !isFailed && !isPendingPayment && (
          <button 
            type="button"
            onClick={handleDownloadInvoice}
            disabled={isGeneratingInvoice}
            className="w-full sm:w-auto border border-neutral-300 hover:border-neutral-900 text-neutral-800 bg-white hover:bg-neutral-50 text-xs font-bold tracking-wider uppercase px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-neutral-600" />
            <span>{isGeneratingInvoice ? "Preparing PDF..." : "Download Tax Invoice"}</span>
          </button>
        )}
      </div>

      {/* 3. Status Stepper OR Payment Issue Alert */}
      {isFailed || isPendingPayment ? (
        /* Failed / Awaiting Payment Alert Box */
        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 sm:p-6 mb-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-bold shrink-0 text-base sm:text-lg">
                ⚠️
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-sm sm:text-base text-amber-950 uppercase tracking-tight">
                  {isPendingPayment ? "Payment Awaiting Bank Confirmation" : "Payment Incomplete or Cancelled"}
                </h3>
                <p className="text-xs text-amber-900 font-medium mt-0.5 leading-relaxed">
                  {order.failureReason || (isPendingPayment ? "We are waiting for your bank to confirm the transaction." : "Transaction was declined or cancelled at the payment gateway.")}
                </p>
              </div>
            </div>

            {/* Actions: Refresh & WhatsApp */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <button
                type="button"
                onClick={handleSyncPayment}
                disabled={isCheckingStatus}
                className="flex-1 sm:flex-initial bg-white hover:bg-neutral-50 text-neutral-800 border border-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <span className={isCheckingStatus ? "animate-spin inline-block" : ""}>🔄</span>
                <span>{isCheckingStatus ? "Checking with Bank..." : "Refresh Status"}</span>
              </button>
              <a
                href={`https://wa.me/918789494263?text=${encodeURIComponent(`Hi Store4Riders, my payment status is pending for Order #${order.orderNumber}. Can you please help?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
              >
                <span>💬 WhatsApp</span>
              </a>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 bg-white border border-amber-200 rounded-lg text-xs text-neutral-800 font-medium">
              {syncMessage}
            </div>
          )}

          {/* RBI Timelines Guidance */}
          <div className="bg-white/85 border border-amber-200/90 rounded-lg p-3 sm:p-4 text-xs text-neutral-700 flex flex-col gap-2">
            <span className="font-bold text-neutral-900 flex items-center gap-1.5">
              <span>🏛️</span> If money was deducted from your bank account:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 flex flex-col">
                <span className="font-bold text-neutral-900">⚡ UPI / GPay / PhonePe</span>
                <span className="text-neutral-600 mt-0.5">Auto-refund in <strong>24 to 48 Hours</strong></span>
              </div>
              <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 flex flex-col">
                <span className="font-bold text-neutral-900">💳 Debit / Credit Cards</span>
                <span className="text-neutral-600 mt-0.5">Auto-refund in <strong>3 to 5 Working Days</strong></span>
              </div>
              <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 flex flex-col">
                <span className="font-bold text-neutral-900">🏦 NetBanking</span>
                <span className="text-neutral-600 mt-0.5">Auto-refund in <strong>2 to 4 Working Days</strong></span>
              </div>
            </div>
            <span className="text-[10px] text-neutral-500 italic">
              *As per RBI Circular DPSS.CO.PD No.629/02.01.014/2019-20, banks automatically credit back unconfirmed transaction debits without manual forms.
            </span>
          </div>
        </div>
      ) : isCancelled ? (
        /* Cancelled State */
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 sm:p-5 rounded-xl mb-6 text-xs sm:text-sm font-bold flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
            ✕
          </div>
          <span>This order has been cancelled.</span>
        </div>
      ) : (
        /* Responsive Mobile + Desktop Stepper */
        <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 mb-6 shadow-2xs">
          <div className="relative pb-2">
            
            {/* Background Track Line */}
            <div className="absolute left-[12%] right-[12%] top-3.5 sm:top-4 h-1 bg-neutral-100 rounded-full z-0" />
            
            {/* Active Progress Fill */}
            <div 
              className="absolute left-[12%] top-3.5 sm:top-4 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
              style={{ width: `${(Math.max(0, currentStatusIndex) / 3) * 76}%` }}
            />

            {/* Steps Row */}
            <div className="relative z-10 flex justify-between w-full">
              {[
                { key: "confirmed", label: "Confirmed" },
                { key: "processing", label: "Processing" },
                { key: "shipped", label: "Shipped" },
                { key: "delivered", label: "Delivered" },
              ].map((step, index) => {
                const isActive = currentStatusIndex >= index;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 text-center px-0.5">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xs" 
                        : "bg-white border-neutral-300 text-neutral-300"
                    }`}>
                      {isActive ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-neutral-300" />
                      )}
                    </div>
                    {/* Clear label on ALL screen sizes */}
                    <span className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-tight mt-1.5 leading-tight ${
                      isActive ? "text-neutral-900" : "text-neutral-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 4. Two Column Layout: Items (Left) & Delivery/Payment (Right) */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        
        {/* Left Column: Items List */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="border-b border-neutral-100 p-3.5 sm:p-4 bg-neutral-50/70 flex items-center justify-between">
              <h2 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-neutral-600" />
                <span>Items in Order ({order.items?.length || 0})</span>
              </h2>
            </div>
            
            <div className="divide-y divide-neutral-100">
              {order.items?.map((item: any) => {
                const itemImg = item.image || item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg";
                const itemSlug = item.slug || item.product?.slug || "";
                const itemName = item.name || item.product?.name || "Riding Gear";
                const unitPrice = item.price ?? item.unitPrice ?? 0;
                const lineTotal = unitPrice * (item.quantity || 1);

                return (
                  <div key={item._id || item.productId} className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 items-center">
                    
                    {/* Thumbnail */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-neutral-50 border border-neutral-100 rounded-lg shrink-0 flex items-center justify-center p-1 overflow-hidden">
                      <Image 
                        src={itemImg} 
                        alt={itemName} 
                        fill 
                        className="object-contain p-1 mix-blend-multiply" 
                        sizes="(max-width: 640px) 64px, 80px"
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      {itemSlug ? (
                        <Link href={`/${itemSlug}`}>
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug hover:text-brand transition-colors">
                            {itemName}
                          </p>
                        </Link>
                      ) : (
                        <p className="text-xs sm:text-sm font-bold text-neutral-900 line-clamp-2 leading-snug">
                          {itemName}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500 mt-1">
                        {item.variantId && <span>Variant: <strong className="text-neutral-800">{item.variantId}</strong></span>}
                        <span>Qty: <strong className="text-neutral-800">{item.quantity}</strong></span>
                        <span>Price: <strong className="text-neutral-800">{formatPrice(unitPrice)}</strong></span>
                      </div>

                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-[10px] text-neutral-400 uppercase font-bold">Item Total:</span>
                        <span className="text-xs sm:text-sm font-black text-brand">{formatPrice(lineTotal)}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Summaries (Payment + Shipping) */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4">
          
          {/* Order Financial Summary */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-2xs">
            <h2 className="font-bold text-xs uppercase tracking-wider text-neutral-900 mb-3 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-neutral-500" />
              <span>Payment Breakdown</span>
            </h2>
            
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-neutral-900">{formatPrice(order.pricing?.subtotal || order.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping / Delivery</span>
                <span className="font-semibold text-neutral-900">
                  {order.pricing?.shipping > 0 ? formatPrice(order.pricing.shipping) : "FREE"}
                </span>
              </div>
              {order.pricing?.tax > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-1">
                    GST ({typeof order.pricing?.taxRate === "number" ? order.pricing.taxRate : 18}%)
                  </span>
                  <span className="font-semibold text-neutral-900">{formatPrice(order.pricing?.tax)}</span>
                </div>
              )}
              {((order.pricing?.couponDiscount || 0) > 0 || (order.pricing?.discount || 0) > 0) && (
                <div className="flex justify-between text-emerald-600">
                  <span>
                    Coupon Discount {order.pricing?.couponCode ? `(${order.pricing.couponCode})` : ""}
                  </span>
                  <span className="font-bold">
                    -{formatPrice(order.pricing?.couponDiscount || order.pricing?.discount || 0)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-3 mt-1 border-t border-dashed border-neutral-200">
                <span className="font-bold text-neutral-900 uppercase text-xs tracking-wider">Grand Total</span>
                <span className="text-lg sm:text-xl font-black text-brand">
                  {formatPrice(order.pricing?.total || order.totalAmount || 0)}
                </span>
              </div>

              {/* COD Partial Advance Breakdown */}
              {order.paymentMethod === "cod" && (order.pricing?.codPartialPaymentAmount || 0) > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
                  <div className="flex justify-between text-amber-900 font-medium">
                    <span>Advance Paid Online:</span>
                    <span className="font-bold">{formatPrice(order.pricing?.codPartialPaymentAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-red-700 font-bold border-t border-amber-200/60 pt-1">
                    <span>Due on Delivery:</span>
                    <span>{formatPrice(order.pricing?.codAmountToCollect ?? (order.pricing?.total - (order.pricing?.codPartialPaymentAmount || 0)))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address & Mode */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 shadow-2xs">
            <h2 className="font-bold text-xs uppercase tracking-wider text-neutral-900 mb-3 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-500" />
              <span>Delivery Details</span>
            </h2>
            
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <p className="font-bold text-neutral-900 text-sm">{order.shippingAddress?.fullName}</p>
                <p className="text-neutral-600 leading-relaxed text-xs mt-0.5">
                  {order.shippingAddress?.street || order.shippingAddress?.addressLine1}
                  {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}<br />
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </p>
                {order.shippingAddress?.phone && (
                  <p className="text-neutral-700 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>{order.shippingAddress.phone}</span>
                  </p>
                )}
              </div>

              {/* Payment Mode Tag */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Payment Method:
                </span>
                <span className="font-bold text-xs text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                  {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Support Assistance */}
          <a
            href={`https://wa.me/918789494263?text=${encodeURIComponent(`Hi Store4Riders, I have a query regarding my Order #${order.orderNumber}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs p-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-center"
          >
            <span>💬 Need help with this order? Chat on WhatsApp</span>
          </a>

        </div>

      </div>

    </div>
  );
}
