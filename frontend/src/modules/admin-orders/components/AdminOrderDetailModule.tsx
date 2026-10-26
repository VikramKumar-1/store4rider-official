"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { formatPrice } from "@store4riders/shared-utils";
import { useAdminOrderById } from "@/core/hooks/useOrderById";
import { 
  useAdminUpdateOrderStatus, 
  useAdminAddOrderNote, 
  useAdminHandleReturn, 
  useAdminDeleteOrder,
  useAdminResendInvoiceEmail,
  useAdminAssignWarehouse
} from "@/core/hooks/useAdminOrders";
import { useWarehouses } from "@/core/hooks/useWarehouses";
import { useGenerateInvoice } from "@/core/hooks/useOrderActions";
import { useOrderShipments } from "@/core/hooks/useShipments";
import { usePushToShiprocket } from "@/core/hooks/useAdminShipments";
import { toast } from "sonner";
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon, 
  ChatBubbleLeftRightIcon, 
  TrashIcon, 
  ChevronDownIcon, 
  CheckIcon,
  EnvelopeIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon,
  LockClosedIcon,
  PhoneIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  TruckIcon,
  PrinterIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

const STATUS_OPTIONS = [
  "pending_payment", "confirmed", "processing", "packed", "shipped", 
  "delivered", "cancelled", "failed", "refunded", 
  "return_requested", "return_approved", "return_picked", "returned"
];

const getStatusLabel = (status: string) => {
  switch (status) {
    case "return_requested": return "Exchange Requested";
    case "return_approved": return "Exchange Approved";
    case "return_picked": return "Exchange Picked Up";
    case "returned": return "Exchange Completed";
    default: return status.replace(/_/g, " ");
  }
};

const isInterStateTax = (originState: string, buyerState: string): boolean => {
  const normalize = (st: string) => {
    const s = (st || "").toLowerCase().replace(/[^a-z]/g, "").trim();
    if (s === "mh" || s === "maharashtra") return "maharashtra";
    if (s === "wb" || s === "westbengal" || s === "bengal") return "westbengal";
    if (s === "br" || s === "bihar") return "bihar";
    if (s === "jh" || s === "jharkhand") return "jharkhand";
    if (s === "dl" || s === "delhi" || s === "nctofdelhi") return "delhi";
    if (s === "ka" || s === "karnataka") return "karnataka";
    if (s === "tn" || s === "tamilnadu") return "tamilnadu";
    if (s === "up" || s === "uttarpradesh") return "uttarpradesh";
    if (s === "gj" || s === "gujarat") return "gujarat";
    if (s === "rj" || s === "rajasthan") return "rajasthan";
    return s;
  };

  const normOrigin = normalize(originState);
  const normBuyer = normalize(buyerState);
  if (!normOrigin || !normBuyer) return false;
  return normOrigin !== normBuyer;
};

export interface AdminOrderDetailModuleProps {
  orderId: string;
  isModal?: boolean;
  onClose?: () => void;
}

export const AdminOrderDetailModule = ({ orderId, isModal = false, onClose }: AdminOrderDetailModuleProps) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { user } = useAuthStore();
  const userRole = user?.role;
  const isCustomerCare = userRole === "customer_care";
  const isLogistic = userRole === "logistic";
  const isAdminOrSuperAdmin = userRole === "admin" || userRole === "super_admin";

  const { data: order, isLoading } = useAdminOrderById(orderId);
  const { data: warehouses } = useWarehouses();
  const { data: orderShipments } = useOrderShipments(orderId);
  const latestShipment = orderShipments && orderShipments.length > 0 ? orderShipments[0] : null;
  const updateStatusMutation = useAdminUpdateOrderStatus();
  const addNoteMutation = useAdminAddOrderNote();
  const handleReturnMutation = useAdminHandleReturn();
  const generateInvoiceMutation = useGenerateInvoice();
  const resendInvoiceMutation = useAdminResendInvoiceEmail();
  const assignWarehouseMutation = useAdminAssignWarehouse();
  const deleteOrderMutation = useAdminDeleteOrder();
  const pushToShiprocketMutation = usePushToShiprocket();
  const router = useRouter();

  const [noteText, setNoteText] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    if (isModal) {
      if (!mounted || typeof document === "undefined") return null;
      return createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-10 max-w-sm w-full text-center space-y-3 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-800 font-bold text-xs uppercase tracking-wider">Loading Full Order File...</p>
          </div>
        </div>,
        document.body
      );
    }
    return <div className="p-12 text-center animate-pulse text-neutral-500 font-bold uppercase">Loading Order...</div>;
  }

  if (!order) {
    if (isModal) {
      if (!mounted || typeof document === "undefined") return null;
      return createPortal(
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-3 shadow-2xl border border-slate-200">
            <p className="text-red-600 font-bold text-sm">Order file could not be found.</p>
            {onClose && (
              <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase">
                Close
              </button>
            )}
          </div>
        </div>,
        document.body
      );
    }
    return <div className="p-12 text-center text-red-500 font-bold">Order not found.</div>;
  }

  // Resolve assigned warehouse dynamically
  const assignedWarehouse = warehouses?.find((w: any) => String(w.id || w._id) === String((order as any).warehouseId)) 
    || warehouses?.find((w: any) => w.isDefault) 
    || warehouses?.[0];

  const originState = (assignedWarehouse?.state || "Maharashtra").trim();
  const customerState = (order.shippingAddress?.state || "").trim();
  const isInterState = isInterStateTax(originState, customerState);

  // Dynamic Tax calculations
  const orderTaxRate = typeof order.pricing?.taxRate === "number" ? order.pricing.taxRate : 0;
  const halfTaxRate = orderTaxRate > 0 ? (orderTaxRate / 2) : 0;
  const igstRateLabel = orderTaxRate % 1 === 0 ? `${orderTaxRate}%` : `${orderTaxRate.toFixed(1)}%`;
  const halfRateLabel = halfTaxRate % 1 === 0 ? `${halfTaxRate}%` : `${halfTaxRate.toFixed(1)}%`;

  // Status & Settlement flags
  const isPaymentFailed = order.status === "failed";
  const isPendingPayment = order.status === "pending_payment";
  const isCancelled = order.status === "cancelled";
  const isUnsettled = isPaymentFailed || isPendingPayment || isCancelled;

  // COD & Payment calculations
  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
  const advancePaid = isUnsettled
    ? 0
    : isCod
    ? (order.pricing?.codPartialPaymentAmount || 0)
    : (order.pricing?.total || 0);

  const balanceCodToCollect = isCod
    ? (order.pricing?.codAmountToCollect !== undefined
        ? order.pricing.codAmountToCollect
        : Math.max(0, (order.pricing?.total || 0) - (isUnsettled ? 0 : (order.pricing?.codPartialPaymentAmount || 0))))
    : 0;

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
    setIsStatusDropdownOpen(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addNoteMutation.mutate({ orderId, text: noteText }, {
      onSuccess: () => setNoteText("")
    });
  };

  const handleReturnAction = (action: "approve" | "reject") => {
    handleReturnMutation.mutate({ orderId, action, adminNote: returnNote });
  };

  const handleDeleteOrder = () => {
    if (window.confirm("Are you sure you want to completely delete this order? This cannot be undone.")) {
      deleteOrderMutation.mutate(orderId, {
        onSuccess: () => {
          router.push("/admin/orders");
        }
      });
    }
  };

  const handleShareWhatsApp = () => {
    const rawPhone = order.shippingAddress?.phone || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const invoiceUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/orders/${order.id || (order as any)._id}/invoice`;

    const total = formatPrice(order.pricing?.total || 0);
    const advanceStr = formatPrice(order.pricing?.codPartialPaymentAmount || 0);
    const dueStr = formatPrice(balanceCodToCollect);

    let msg = "";
    if (isPaymentFailed || isPendingPayment) {
      msg = `*Store4Riders — Order Assistance (Payment Update)*\n`;
      msg += `Hello *${order.shippingAddress?.fullName || "Rider"}*,\n`;
      msg += `We noticed you attempted to place order *#${order.orderNumber}* for *${total}*, but payment was not completed at the gateway.\n\n`;
      msg += `Would you like us to help you complete this order or retry payment with UPI/Card?\n\n`;
      msg += `Reply to this message or call our support team for quick assistance!\n`;
      msg += `— Team Store4Riders`;
    } else {
      msg = `*Store4Riders — Tax Invoice & Order Update*\n`;
      msg += `Hello *${order.shippingAddress?.fullName || "Rider"}*,\n`;
      msg += `Thank you for your order *#${order.orderNumber}*!\n\n`;
      msg += `📦 *Order Summary:*\n`;
      msg += `• Total Amount: ${total}\n`;
      if (isCod) {
        msg += `• Online Advance Paid: ${advanceStr}\n`;
        msg += `• *Cash Due on Delivery: ${dueStr}*\n`;
      } else {
        msg += `• Payment: Paid in Full Online (Prepaid)\n`;
      }
      msg += `\n📄 *Download Tax Invoice PDF:*\n${invoiceUrl}\n\n`;
      msg += `*Exchange Policy:* Store4Riders offers a 7-day size & gear exchange only. No monetary returns/refunds.\n\n`;
      msg += `Need help? Contact support@store4riders.com`;
    }

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const mainContent = (
    <>
      {(order.status === "failed" || order.status === "pending_payment") && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-red-900">
              {order.status === "failed" ? "Payment Failed / Transaction Uncaptured" : "Pending Payment / Checkout Drop-Off"}
            </div>
            <p className="text-xs text-red-700">
              Reason: <span className="font-semibold">{order.failureReason || "Transaction was declined or abandoned at payment gateway"}</span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            {(() => {
              const totalUnits = (order.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
              const distinctCount = order.items?.length || 0;
              return (
                <>
                  <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-2">
                    <h2 className="text-sm font-black uppercase text-neutral-900">
                      Order Items
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs font-mono shadow-xs">
                        {totalUnits} {totalUnits === 1 ? "Unit" : "Total Units"}
                      </span>
                      {distinctCount > 1 && (
                        <span className="text-xs text-neutral-500 font-medium">
                          • {distinctCount} Products
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {order.items?.map((item: any, idx: number) => {
                      const itemImg = item.image || item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg";
                      const itemSlug = item.slug || item.product?.slug || "";
                      const qty = item.quantity || 1;
                      return (
                        <div key={item.productId + (item.variantId || "") + idx} className="py-4 flex justify-between items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-center p-1 shrink-0 relative overflow-hidden shadow-xs">
                              <Image 
                                src={itemImg} 
                                alt={item.name || "Product"} 
                                fill 
                                className="object-contain p-0.5 mix-blend-multiply" 
                                sizes="56px"
                              />
                              <div className="absolute top-1 left-1 bg-slate-900/90 text-white font-mono font-bold text-[8px] px-1 rounded">
                                #{idx + 1}
                              </div>
                            </div>
                            <div className="min-w-0">
                              {itemSlug ? (
                                <Link href={`/${itemSlug}`} target="_blank" className="font-bold text-neutral-900 hover:text-brand transition-colors line-clamp-1">
                                  {item.name}
                                </Link>
                              ) : (
                                <div className="font-bold text-neutral-900 line-clamp-1">{item.name}</div>
                              )}
                              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                                <span>SKU: {item.sku}</span>
                                {item.variantId && <span>• Variant: {item.variantId}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <div className="text-sm font-bold text-neutral-900 font-mono">{formatPrice(item.unitPrice * qty)}</div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-black text-xs font-mono shadow-xs">
                                {qty} {qty === 1 ? "PC" : "PCS"}
                              </span>
                              {qty > 1 && (
                                <span className="text-[11px] text-neutral-400 font-mono">
                                  ({formatPrice(item.unitPrice)} each)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Payment & Cash Collection Card */}
          <div className={`border rounded-lg p-6 shadow-sm ${
            isPaymentFailed 
              ? "bg-red-50/50 border-red-200" 
              : isPendingPayment 
              ? "bg-amber-50/50 border-amber-200" 
              : isCod 
              ? "bg-amber-50/50 border-amber-200" 
              : "bg-emerald-50/40 border-emerald-200"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70 mb-4">
              <div className="flex items-center gap-2">
                {isPaymentFailed ? (
                  <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                ) : isPendingPayment ? (
                  <ClockIcon className="w-5 h-5 text-amber-600" />
                ) : isCod ? (
                  <BanknotesIcon className="w-5 h-5 text-amber-600" />
                ) : (
                  <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                )}
                <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                  {isPaymentFailed 
                    ? "Payment Failed / Uncaptured Transaction"
                    : isPendingPayment
                    ? "Pending Payment / Checkout Drop-Off"
                    : isCod 
                    ? "COD Payment & Doorstep Cash Collection" 
                    : "Online Prepaid Payment Summary"}
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider ${
                isPaymentFailed
                  ? "bg-red-100 text-red-900 border border-red-300"
                  : isPendingPayment
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : isCod
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}>
                {isPaymentFailed
                  ? "Payment Failed"
                  : isPendingPayment
                  ? "Awaiting Payment"
                  : isCod
                  ? "Partial COD"
                  : "Paid in Full"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Total Order Value</span>
                <span className="text-lg font-black text-neutral-900 mt-1 block">{formatPrice(order.pricing?.total || 0)}</span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">Includes Taxes & Delivery</span>
              </div>

              <div className={`p-4 rounded-lg border shadow-sm ${
                isUnsettled ? "bg-red-50/40 border-red-200" : "bg-white border-neutral-200"
              }`}>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {isUnsettled
                    ? "Online Funds Captured"
                    : isCod
                    ? "Advance Paid Online (UPI/Gateway)"
                    : "Total Paid Online"}
                </span>
                <span className={`text-lg font-black mt-1 block ${
                  isUnsettled ? "text-red-700" : "text-emerald-600"
                }`}>
                  {formatPrice(advancePaid)}
                </span>
                {isUnsettled ? (
                  <span className="text-[11px] text-red-700 font-bold mt-0.5 flex items-center gap-1">
                    <XCircleIcon className="w-3.5 h-3.5 inline text-red-600 shrink-0" />
                    {isPaymentFailed ? "Gateway Declined / Not Received" : "Awaiting Gateway / Abandoned"}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5 inline" /> Verified Gateway Payment
                  </span>
                )}
              </div>

              <div className={`p-4 rounded-lg border shadow-sm ${
                isUnsettled
                  ? "bg-red-100/60 border-red-300"
                  : isCod
                  ? "bg-red-50 border-red-300"
                  : "bg-neutral-50 border-neutral-200"
              }`}>
                <span className="text-[10px] uppercase font-bold text-neutral-600 block tracking-wider">
                  {isUnsettled ? "Fulfillment Instruction" : isCod ? "Doorstep Cash to Collect (COD)" : "Balance Due"}
                </span>
                <span className={`text-xl font-black mt-1 block ${
                  isUnsettled ? "text-red-800" : isCod ? "text-red-700" : "text-neutral-500"
                }`}>
                  {isUnsettled ? "DO NOT DISPATCH" : formatPrice(isCod ? balanceCodToCollect : 0)}
                </span>
                {isUnsettled ? (
                  <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block mt-1">
                    ⚠️ Order on hold until payment clears
                  </span>
                ) : isCod ? (
                  <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block mt-1">
                    ⚠️ Delivery Agent must collect
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400 font-bold block mt-0.5">Nil (Fully settled online)</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Breakdown with Dynamic GST */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Pricing</h2>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.pricing?.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.pricing?.shipping || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({order.pricing?.taxRate || 0}%)</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.pricing?.tax || 0)}</span>
              </div>
              
              {/* Dynamic GST Regime Breakdown */}
              <div className="flex justify-between items-center text-xs text-neutral-500 pt-0.5">
                <span className="flex items-center gap-1.5 font-medium">
                  {orderTaxRate === 0
                    ? "0% Tax (Exempt / Zero-Rated)"
                    : isInterState
                      ? `IGST (${igstRateLabel})`
                      : `CGST (${halfRateLabel}) + SGST (${halfRateLabel})`}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                    orderTaxRate === 0
                      ? "bg-neutral-100 text-neutral-700 border border-neutral-200"
                      : isInterState 
                        ? "bg-amber-100 text-amber-800" 
                        : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {orderTaxRate === 0 ? "Exempt / 0%" : isInterState ? "Inter-State" : "Intra-State"}
                  </span>
                </span>
                <span className="font-medium text-neutral-700">Place of Supply: {customerState || "N/A"}</span>
              </div>

              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.pricing.discount)}</span>
                </div>
              )}
              {order.pricing?.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({order.pricing.couponCode})</span>
                  <span className="font-bold">-{formatPrice(order.pricing.couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-4 border-t border-neutral-100 mt-2 text-lg font-black text-neutral-900">
                <span>Total</span>
                <span className="text-brand">{formatPrice(order.pricing?.total || 0)}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2 flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-neutral-400" />
              Internal Notes & Audit Log
            </h2>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
              {(order as any).notes?.length === 0 ? (
                <div className="text-sm text-neutral-400 italic">No notes added yet.</div>
              ) : (
                (order as any).notes?.map((note: any, idx: number) => (
                  <div key={idx} className="bg-neutral-50 border border-neutral-100 p-3 rounded text-sm">
                    <p className="text-neutral-800">{note.text}</p>
                    <div className="flex justify-between items-center mt-2 text-[10px] uppercase font-bold text-neutral-400">
                      <span>{note.author}</span>
                      <span>{format(new Date(note.timestamp), "MMM dd, HH:mm")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Type an internal note..."
                className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand"
              />
              <button 
                type="submit" 
                disabled={addNoteMutation.isPending || !noteText.trim()}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs uppercase rounded disabled:opacity-50"
              >
                {addNoteMutation.isPending ? "..." : "Add Note"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column - Status & Communications */}
        <div className="space-y-6">
          
          {/* Status Updater */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Status</h2>
            
            <div className="mb-2 relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Current Status</label>
              <button
                onClick={() => !updateStatusMutation.isPending && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                disabled={updateStatusMutation.isPending || (isCustomerCare && order.status === "cancelled")}
                className="w-full px-4 py-3 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand font-bold uppercase text-neutral-800 bg-white shadow-sm flex items-center justify-between transition-all hover:border-neutral-400 disabled:opacity-50"
              >
                <span>{getStatusLabel(order.status)}</span>
                <ChevronDownIcon className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isStatusDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                  <div className="p-1">
                    {isCustomerCare ? (
                      /* Customer Care can only cancel active orders */
                      order.status !== "cancelled" ? (
                        <button
                          onClick={() => handleStatusChange("cancelled")}
                          className="w-full text-left px-3 py-2 text-xs font-bold uppercase rounded text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Cancel Order (Customer Request)
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-xs text-neutral-400 italic">
                          Order is already cancelled
                        </div>
                      )
                    ) : (
                      /* Logistics and Admins can update through all statuses */
                      STATUS_OPTIONS.map(s => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded flex items-center justify-between transition-colors ${
                            order.status === s 
                              ? "bg-brand/10 text-brand" 
                              : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                          }`}
                        >
                          {getStatusLabel(s)}
                          {order.status === s && <CheckIcon className="w-4 h-4" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {isCustomerCare && (
              <p className="text-[11px] text-neutral-500 mt-2">
                Customer Care: Can view order details and cancel order upon rider request.
              </p>
            )}
          </div>

          {/* Customer Invoice & Communications / Payment Recovery */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-1 border-b border-neutral-100 pb-2">
              {isUnsettled ? "Payment Recovery & Customer Follow-Up" : "Customer Invoice & Dispatch"}
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed mb-3">
              {isUnsettled
                ? "Payment was not captured for this order. Official GST tax invoices cannot be issued for unpaid or dropped transactions. Reach out to the rider to assist with payment completion."
                : "Generate official GST tax invoices and send directly to customer via Email or WhatsApp."}
            </p>

            {isUnsettled ? (
              <div className="space-y-2.5">
                {/* WhatsApp Recovery Button */}
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-[#1ebd59] transition-colors shadow-sm"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  Send Payment Recovery via WhatsApp
                </button>

                {/* Call Customer Button */}
                {order.shippingAddress?.phone && (
                  <a
                    href={`tel:${order.shippingAddress.phone.replace(/[^0-9]/g, "")}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 bg-white text-neutral-900 font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-50 transition-colors"
                  >
                    <PhoneIcon className="w-4 h-4 text-neutral-600" />
                    Call Customer ({order.shippingAddress.phone})
                  </a>
                )}

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-center">
                  <span className="text-[11px] font-bold text-neutral-500 flex items-center justify-center gap-1.5">
                    <LockClosedIcon className="w-3.5 h-3.5" /> GST Invoice locked (Requires confirmed payment)
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Button 1: Download PDF */}
                <button
                  onClick={() => generateInvoiceMutation.mutate(orderId)}
                  disabled={generateInvoiceMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 bg-white text-neutral-800 font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-50 transition-colors disabled:opacity-50"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 text-neutral-600" />
                  {generateInvoiceMutation.isPending ? "Generating..." : "Download Invoice PDF"}
                </button>

                {/* Button 2: Resend Email */}
                <button
                  onClick={() => resendInvoiceMutation.mutate(orderId)}
                  disabled={resendInvoiceMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  <EnvelopeIcon className="w-4 h-4" />
                  {resendInvoiceMutation.isPending ? "Sending Email..." : "Resend Invoice via Email"}
                </button>

                {/* Button 3: WhatsApp Share */}
                <button
                  onClick={handleShareWhatsApp}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-[#1ebd59] transition-colors shadow-sm"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  Send Invoice via WhatsApp
                </button>
              </>
            )}
          </div>

          {/* Dispatch Origin Warehouse Card */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <BuildingStorefrontIcon className="w-5 h-5 text-neutral-500" />
                <h2 className="text-sm font-black uppercase text-neutral-900">Dispatch Origin & GST State</h2>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                orderTaxRate === 0
                  ? "bg-neutral-100 text-neutral-700 border border-neutral-200"
                  : isInterState 
                    ? "bg-amber-100 text-amber-800 border border-amber-300" 
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
              }`}>
                {orderTaxRate === 0
                  ? (isInterState ? "Inter-State (0% Exempt)" : "Intra-State (0% Exempt)")
                  : (isInterState ? `Inter-State (IGST ${igstRateLabel})` : `Intra-State (CGST+SGST ${halfRateLabel}+${halfRateLabel})`)}
              </span>
            </div>

            <div className="space-y-3">
              {latestShipment?.provider ? (
                /* Auto-synced from Courier Dashboard */
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Synced with {latestShipment.provider.toUpperCase()}
                    </span>
                    {latestShipment.awb ? (
                      <span className="font-mono text-xs font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                        AWB: {latestShipment.awb}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                        In Courier Processing
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-neutral-900">
                    {assignedWarehouse?.name || "Warehouse"} — {assignedWarehouse?.city}, {assignedWarehouse?.state} ({assignedWarehouse?.pincode})
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Courier: <span className="capitalize font-semibold">{latestShipment.courierName || latestShipment.provider}</span> • Status: {latestShipment.providerStatus || latestShipment.status}
                  </p>
                  {latestShipment.labelUrl && (
                    <div className="pt-2 border-t border-emerald-200">
                      <a
                        href={latestShipment.labelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 hover:underline"
                      >
                        <PrinterIcon className="w-3.5 h-3.5" />
                        <span>Print Shipping Label (PDF)</span>
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Pending Courier Dispatch */
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Pending Courier Dispatch
                  </div>
                  <p className="text-xs text-neutral-800">
                    Dispatch Warehouse: <span className="font-bold">{assignedWarehouse?.name || "Central Warehouse"} ({originState})</span>
                  </p>

                  {!isUnsettled && (
                    <button
                      type="button"
                      onClick={() => pushToShiprocketMutation.mutate(orderId, {
                        onSuccess: () => toast.success("AWB assigned and order dispatched via Shiprocket!"),
                        onError: (err: any) => toast.error(err.response?.data?.message || err.message || "Failed to dispatch via Shiprocket")
                      })}
                      disabled={pushToShiprocketMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded shadow-xs transition-colors disabled:opacity-50"
                    >
                      <TruckIcon className="w-4 h-4" />
                      {pushToShiprocketMutation.isPending ? "Generating AWB via Shiprocket..." : "Dispatch & Generate AWB via Shiprocket"}
                    </button>
                  )}
                </div>
              )}

              {/* State Comparison & Place of Supply */}
              <div className="bg-neutral-50 border border-neutral-200 rounded p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Origin State (Dispatch):</span>
                  <span className="font-bold text-neutral-900">{originState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Destination State (Customer):</span>
                  <span className="font-bold text-neutral-900">{customerState || "Not Specified"}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-neutral-200 text-neutral-800">
                  <span>Place of Supply:</span>
                  <span className="font-black text-brand">{customerState || originState}</span>
                </div>
              </div>

              {/* Collapsible Manual Override (For Offline / Emergency) */}
              <details className="text-xs text-neutral-500 pt-1 group">
                <summary className="cursor-pointer font-bold text-[11px] text-neutral-600 hover:text-neutral-900 select-none flex items-center justify-between">
                  <span>Manual Warehouse Override (Offline Orders)</span>
                  <span className="text-[10px] text-neutral-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <select
                    value={assignedWarehouse?.id || String(assignedWarehouse?._id || "")}
                    onChange={(e) => assignWarehouseMutation.mutate({ orderId, warehouseId: e.target.value })}
                    disabled={assignWarehouseMutation.isPending}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-xs bg-white font-medium text-neutral-900 focus:outline-none focus:border-brand"
                  >
                    {warehouses?.map((wh: any) => (
                      <option key={wh.id || String(wh._id)} value={wh.id || String(wh._id)}>
                        {wh.name} — {wh.city}, {wh.state} ({wh.pincode}) {wh.isDefault ? "[Default Hub]" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Only use manual override if shipping outside Shiprocket/courier dashboards.
                  </p>
                </div>
              </details>
            </div>
          </div>

          {/* Exchange Management (Only visible if requested) */}
          {order.status === "return_requested" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 animate-in fade-in">
              <h2 className="text-sm font-black uppercase text-orange-900 mb-2">Exchange Request Pending</h2>
              <p className="text-xs text-orange-700 mb-4">
                Customer has requested an exchange for size or product.
                {isCustomerCare ? " Exchange inspection & approval is handled by Logistics." : " Review and take action."}
              </p>
              
              {!isCustomerCare ? (
                <>
                  <input 
                    type="text" 
                    value={returnNote}
                    onChange={e => setReturnNote(e.target.value)}
                    placeholder="Reason / Note to customer for exchange..."
                    className="w-full px-3 py-2 border border-orange-200 rounded text-sm mb-4 focus:outline-none focus:border-orange-400 bg-white"
                  />

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleReturnAction("approve")}
                      disabled={handleReturnMutation.isPending}
                      className="flex-1 py-2 bg-green-600 text-white font-bold text-xs uppercase rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve Exchange
                    </button>
                    <button 
                      onClick={() => handleReturnAction("reject")}
                      disabled={handleReturnMutation.isPending}
                      className="flex-1 py-2 bg-red-600 text-white font-bold text-xs uppercase rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject Exchange
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-xs font-semibold text-orange-800 bg-orange-100/60 p-2.5 rounded border border-orange-200">
                  ⓘ Logistics team handles pickup and approval of exchanges.
                </div>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Customer & Shipping</h2>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Name</span>
                <span className="font-bold text-neutral-900">{order.shippingAddress?.fullName}</span>
              </div>
              {(order as any).businessName && (
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Company (B2B)</span>
                  <span className="font-bold text-neutral-900">{(order as any).businessName}</span>
                </div>
              )}
              {(order as any).customerGstin && (
                <div>
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Buyer GSTIN</span>
                  <span className="font-mono text-xs font-bold text-brand bg-brand/5 px-2 py-0.5 rounded border border-brand/20 inline-block">{(order as any).customerGstin}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Phone</span>
                <span className="text-neutral-800">{order.shippingAddress?.phone}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Address</span>
                <span className="text-neutral-800 block">{order.shippingAddress?.addressLine1}</span>
                {order.shippingAddress?.addressLine2 && <span className="text-neutral-800 block">{order.shippingAddress?.addressLine2}</span>}
                <span className="text-neutral-800 block">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Payment Method</span>
                <span className="text-neutral-800 uppercase font-bold">{order.paymentMethod === 'cod' ? 'COD' : 'PREPAID'}</span>
                <span className={`text-[10px] font-bold block mt-1 ${
                  isPaymentFailed
                    ? 'text-red-600 font-black'
                    : isPendingPayment
                    ? 'text-amber-700 font-bold'
                    : isCancelled
                    ? 'text-neutral-500 font-bold'
                    : isCod
                    ? 'text-neutral-600 font-bold'
                    : 'text-emerald-600 font-bold'
                }`}>
                  STATUS: {
                    isPaymentFailed
                      ? 'PAYMENT FAILED / UNCAPTURED'
                      : isPendingPayment
                      ? 'PENDING PAYMENT / CHECKOUT DROPPED'
                      : isCancelled
                      ? 'CANCELLED'
                      : isCod
                      ? (order.status === 'delivered' ? 'COLLECTED AT DOORSTEP' : 'DUE ON DELIVERY')
                      : 'PAID (VERIFIED GATEWAY)'
                  }
                </span>
                {order.paymentMethod && order.paymentMethod !== 'cod' && (
                  <span className="text-[10px] font-bold block mt-1 text-neutral-400">
                    GATEWAY: {order.paymentMethod.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone (Admin & Super Admin ONLY) */}
          {isAdminOrSuperAdmin && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-6">
              <h2 className="text-sm font-black uppercase text-red-900 mb-2">Danger Zone</h2>
              <p className="text-xs text-red-700 mb-4">Deleting this order will permanently remove it from the system.</p>
              <button
                onClick={handleDeleteOrder}
                disabled={deleteOrderMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
                {deleteOrderMutation.isPending ? "Deleting..." : "Delete Order"}
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );

  if (isModal) {
    if (!mounted || typeof document === "undefined") return null;
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
        <div 
          className="w-full max-w-6xl bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 text-white">
                <ClipboardDocumentIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase">
                    Full Order File #{order.orderNumber || order.id || (order as any)._id}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    order.status === "delivered" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                    order.status === "cancelled" ? "bg-slate-100 text-slate-700 border border-slate-200" :
                    order.status === "failed" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                    "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' hh:mm a")} • Full Administrative Dossier &amp; Operations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                title="Share on WhatsApp"
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Close Full Order File"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto overscroll-contain space-y-6 [will-change:scroll-position]">
            {mainContent}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 border border-neutral-200 rounded hover:bg-neutral-50">
          <ArrowLeftIcon className="w-5 h-5 text-neutral-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase">Order #{order.orderNumber || order.id || (order as any)._id}</h1>
          <p className="text-sm text-neutral-500 mt-1">Placed on {format(new Date(order.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}</p>
        </div>
      </div>

      {mainContent}
    </div>
  );
};
