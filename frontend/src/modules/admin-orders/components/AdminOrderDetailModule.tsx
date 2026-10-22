"use client";

import React, { useState, useRef, useEffect } from "react";
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
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  "pending_payment", "confirmed", "processing", "packed", "shipped", 
  "delivered", "cancelled", "failed", "refunded", 
  "return_requested", "return_approved", "return_picked", "returned"
];

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

export const AdminOrderDetailModule = ({ orderId }: { orderId: string }) => {
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
    return <div className="p-12 text-center animate-pulse text-neutral-500 font-bold uppercase">Loading Order...</div>;
  }

  if (!order) {
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

  // COD & Payment calculations
  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
  const advancePaid = isCod ? (order.pricing?.codPartialPaymentAmount || 0) : (order.pricing?.total || 0);
  const balanceCodToCollect = isCod
    ? (order.pricing?.codAmountToCollect !== undefined
        ? order.pricing.codAmountToCollect
        : Math.max(0, (order.pricing?.total || 0) - advancePaid))
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

    let msg = `*Store4Riders — Tax Invoice & Order Update*\n`;
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

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-4 border-b border-neutral-100 pb-2">Items</h2>
            <div className="divide-y divide-neutral-100">
              {order.items?.map((item: any) => {
                const itemImg = item.image || item.product?.images?.[0]?.url || item.product?.image || "/no-image.svg";
                const itemSlug = item.slug || item.product?.slug || "";
                return (
                  <div key={item.productId + (item.variantId || "")} className="py-4 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-neutral-50 border border-neutral-100 rounded flex items-center justify-center p-1 shrink-0 relative overflow-hidden">
                        <Image 
                          src={itemImg} 
                          alt={item.name || "Product"} 
                          fill 
                          className="object-contain p-0.5 mix-blend-multiply" 
                          sizes="56px"
                        />
                      </div>
                      <div className="min-w-0">
                        {itemSlug ? (
                          <Link href={`/${itemSlug}`} target="_blank" className="font-bold text-neutral-900 hover:text-brand transition-colors line-clamp-1">
                            {item.name}
                          </Link>
                        ) : (
                          <div className="font-bold text-neutral-900 line-clamp-1">{item.name}</div>
                        )}
                        <div className="text-xs text-neutral-500 font-mono mt-0.5">SKU: {item.sku}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-neutral-900">{formatPrice(item.unitPrice)}</div>
                      <div className="text-xs text-neutral-500">Qty: {item.quantity}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COD Payment & Doorstep Cash Collection Card */}
          <div className={`border rounded-lg p-6 shadow-sm ${isCod ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50/40 border-emerald-200"}`}>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/70 mb-4">
              <div className="flex items-center gap-2">
                <BanknotesIcon className={`w-5 h-5 ${isCod ? "text-amber-600" : "text-emerald-600"}`} />
                <h2 className="text-sm font-black uppercase tracking-tight text-neutral-900">
                  {isCod ? "COD Payment & Doorstep Cash Collection" : "Online Prepaid Payment Summary"}
                </h2>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider ${
                isCod ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}>
                {isCod ? "Partial COD" : "Paid in Full"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Total Order Value</span>
                <span className="text-lg font-black text-neutral-900 mt-1 block">{formatPrice(order.pricing?.total || 0)}</span>
                <span className="text-[11px] text-neutral-500 mt-0.5 block">Includes Taxes & Delivery</span>
              </div>

              <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                  {isCod ? "Advance Paid Online (UPI/Gateway)" : "Total Paid Online"}
                </span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">
                  {formatPrice(isCod ? (order.pricing?.codPartialPaymentAmount || 0) : (order.pricing?.total || 0))}
                </span>
                <span className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 inline" /> Verified Gateway Payment
                </span>
              </div>

              <div className={`p-4 rounded-lg border shadow-sm ${isCod ? "bg-red-50 border-red-300" : "bg-neutral-50 border-neutral-200"}`}>
                <span className="text-[10px] uppercase font-bold text-neutral-600 block tracking-wider">
                  {isCod ? "Doorstep Cash to Collect (COD)" : "Balance Due"}
                </span>
                <span className={`text-2xl font-black mt-1 block ${isCod ? "text-red-700" : "text-neutral-500"}`}>
                  {formatPrice(isCod ? balanceCodToCollect : 0)}
                </span>
                {isCod ? (
                  <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider block mt-1">
                    ⚠️ Delivery Agent must collect
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400 font-bold block mt-0.5">Nil (Fully settled online)</span>
                )}
              </div>
            </div>

            {/* Exchange Policy Notice */}
            <div className="p-3 bg-white/90 rounded border border-neutral-200/90 text-xs text-neutral-700 flex items-start gap-2">
              <span className="text-brand font-black text-sm">ⓘ</span>
              <div>
                <span className="font-bold text-neutral-900">Store4Riders Exchange Policy (Strict No-Refund): </span>
                Products are eligible for 7-day size and defect exchange only. No monetary cash refunds or returns are issued.
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
            
            <div className="mb-4 relative" ref={dropdownRef}>
              <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">Current Status</label>
              <button
                onClick={() => !updateStatusMutation.isPending && setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                disabled={updateStatusMutation.isPending}
                className="w-full px-4 py-3 border border-neutral-300 rounded text-sm focus:outline-none focus:border-brand font-bold uppercase text-neutral-800 bg-white shadow-sm flex items-center justify-between transition-all hover:border-neutral-400 disabled:opacity-50"
              >
                <span>{order.status.replace(/_/g, " ")}</span>
                <ChevronDownIcon className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${isStatusDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isStatusDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                  <div className="p-1">
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-3 py-2 text-xs font-bold uppercase rounded flex items-center justify-between transition-colors ${
                          order.status === s 
                            ? "bg-brand/10 text-brand" 
                            : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900"
                        }`}
                      >
                        {s.replace(/_/g, " ")}
                        {order.status === s && <CheckIcon className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Invoice & Communications */}
          <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-black uppercase text-neutral-900 mb-1 border-b border-neutral-100 pb-2">
              Customer Invoice & Dispatch
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed mb-3">
              Generate official GST tax invoices and send directly to customer via Email or WhatsApp.
            </p>

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
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-Synced from {latestShipment.provider.toUpperCase()} Dashboard
                    </span>
                    {latestShipment.awb && (
                      <span className="font-mono text-xs font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                        AWB: {latestShipment.awb}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-neutral-900">
                    {assignedWarehouse?.name || "Warehouse"} — {assignedWarehouse?.city}, {assignedWarehouse?.state} ({assignedWarehouse?.pincode})
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Courier: <span className="capitalize font-semibold">{latestShipment.courierName || latestShipment.provider}</span> • Status: {latestShipment.providerStatus || latestShipment.status}
                  </p>
                </div>
              ) : (
                /* Pending Courier Dispatch */
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5">
                  <div className="flex items-center gap-1.5 text-amber-800 text-[10px] font-black uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Pending Courier Dispatch (Dashboard Selection)
                  </div>
                  <p className="text-xs text-neutral-800">
                    Current Godown: <span className="font-bold">{assignedWarehouse?.name || "Central Warehouse"} ({originState})</span>
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1 leading-snug">
                    When you ship this order in your <b>Shiprocket / Delhivery / Xpressbees</b> dashboard and choose your pickup location, our webhook will automatically update this warehouse and align the Tax Invoice state.
                  </p>
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

          {/* Return Management (Only visible if requested) */}
          {order.status === "return_requested" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 animate-in fade-in">
              <h2 className="text-sm font-black uppercase text-orange-900 mb-2">Exchange / Return Request Pending</h2>
              <p className="text-xs text-orange-700 mb-4">Customer has requested an exchange. Review and take action.</p>
              
              <input 
                type="text" 
                value={returnNote}
                onChange={e => setReturnNote(e.target.value)}
                placeholder="Reason / Note to customer (optional)"
                className="w-full px-3 py-2 border border-orange-200 rounded text-sm mb-4 focus:outline-none focus:border-orange-400 bg-white"
              />

              <div className="flex gap-2">
                <button 
                  onClick={() => handleReturnAction("approve")}
                  disabled={handleReturnMutation.isPending}
                  className="flex-1 py-2 bg-green-600 text-white font-bold text-xs uppercase rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReturnAction("reject")}
                  disabled={handleReturnMutation.isPending}
                  className="flex-1 py-2 bg-red-600 text-white font-bold text-xs uppercase rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
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
                <span className={`text-[10px] font-bold block mt-1 ${order.paymentMethod !== 'cod' ? 'text-emerald-600' : 'text-neutral-500'}`}>
                  STATUS: {order.paymentMethod !== 'cod' ? 'PAID' : 'UNPAID'}
                </span>
                {order.paymentMethod !== 'cod' && (
                  <span className="text-[10px] font-bold block mt-1 text-neutral-400">
                    GATEWAY: {order.paymentMethod.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Danger Zone */}
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

        </div>
      </div>
    </div>
  );
};
