"use client";

import React, { useRef, useEffect } from "react";
import { XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";

interface ShippingLabelModalProps {
  order: any;
  onClose: () => void;
}

export const ShippingLabelModal: React.FC<ShippingLabelModalProps> = ({ order, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Real store settings from MongoDB
  const { data: publicSettings } = usePublicSettings();

  if (!order) return null;

  const orderNum = order.orderNumber || order.id || order._id;
  const shipment = order.shipment || {};
  const awb = shipment.awb || "AWB-PENDING";
  const courierName = shipment.courierName || shipment.provider || "Carrier Assigned";
  const isCod = String(order.paymentMethod || "").toLowerCase() === "cod";
  const codAmount = order.codAmountToCollect || order.pricing?.codAmountToCollect || order.pricing?.total || 0;

  // Consignee (Customer) Address resolution from real order data
  const customerName = order.customer?.fullName || order.shippingAddress?.fullName || "Valued Customer";
  const customerPhone = order.customer?.phone || order.shippingAddress?.phone || "";
  const addressLine1 = order.customer?.addressLine1 || order.shippingAddress?.addressLine1 || (order.shippingAddress as any)?.street || "";
  const addressLine2 = order.customer?.addressLine2 || order.shippingAddress?.addressLine2 || "";
  const city = order.customer?.city || order.shippingAddress?.city || "";
  const state = order.customer?.state || order.shippingAddress?.state || "";
  const pincode = order.customer?.pincode || order.shippingAddress?.pincode || "";
  const country = order.customer?.country || order.shippingAddress?.country || "India";

  const fullStreet = [addressLine1, addressLine2].filter(Boolean).join(", ");
  const cityStatePin = [city, state, pincode ? `PIN: ${pincode}` : ""].filter(Boolean).join(", ");

  // Store Origin / Pickup Location (Pickup configured directly on Shiprocket / Carrier)
  const originName = publicSettings?.legalBusinessName || "Store4Riders";
  const originStreet = publicSettings?.storeOriginAddress || "";
  const originCity = publicSettings?.storeOriginCity || "";
  const originState = publicSettings?.storeOriginState || "";
  const originPincode = publicSettings?.storeOriginPincode || "";
  const originCityStatePin = [originCity, originState, originPincode ? `PIN: ${originPincode}` : ""].filter(Boolean).join(", ");
  const originPhone = publicSettings?.supportPhone || "";
  const originEmail = publicSettings?.supportEmail || "";
  const originContact = [originPhone, originEmail].filter(Boolean).join(" / ");
  const originGstin = publicSettings?.gstin || "";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-sm print:p-0 print:bg-white print:static"
      onClick={onClose}
    >
      {/* Thermal Printer Specific CSS: Exact 4x6 inch standard label */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-shipping-label, #thermal-shipping-label * {
            visibility: visible !important;
          }
          #thermal-shipping-label {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 4in !important;
            height: 6in !important;
            margin: 0 !important;
            padding: 8px !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
          @page {
            size: 4in 6in;
            margin: 0;
          }
        }
      `}</style>

      {/* Modal Dialog Card (Constrained to max 92vh, never overflows viewport) */}
      <div 
        className="w-full max-w-lg max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col print:border-none print:shadow-none print:max-w-none print:w-auto print:max-h-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar (Sticky, never clips or scrolls away) */}
        <div className="shrink-0 px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-slate-900">
              4×6″ Thermal Shipping Label
            </span>
            <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              #{orderNum}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand/90 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              <span>Print Label</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Close label preview"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body: Fits perfectly on all screen resolutions */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-100 flex items-center justify-center print:p-0 print:bg-white print:overflow-visible">
          <div
            id="thermal-shipping-label"
            ref={printRef}
            className="w-[350px] min-h-[520px] bg-white border-2 border-black p-3 text-black font-sans flex flex-col justify-between shadow-md print:shadow-none shrink-0"
            style={{ width: "350px", minHeight: "520px" }}
          >
            {/* Top Section */}
            <div>
              {/* 1. Header: Store Logo & Carrier Partner */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div>
                  <span className="text-lg font-black tracking-tighter uppercase block leading-none">
                    STORE4RIDERS
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-neutral-600 block mt-0.5 font-bold">
                    Official Riding Gear
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-neutral-500 block">Carrier Partner</span>
                  <span className="text-sm font-black uppercase text-black block tracking-tight">
                    {courierName}
                  </span>
                </div>
              </div>

              {/* 2. Routing Code & Payment Type */}
              <div className="grid grid-cols-2 border-b-2 border-black">
                <div className="p-2 border-r-2 border-black">
                  <span className="text-[8px] font-bold uppercase text-neutral-500 block">Routing Destination</span>
                  <span className="text-base font-black uppercase tracking-tight block">
                    {city || "DEST"} - {pincode || "000000"}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-700 block">
                    {state || "IN"}
                  </span>
                </div>

                <div className="p-2 flex flex-col justify-center items-center text-center">
                  <span className="text-[8px] font-bold uppercase text-neutral-500 block">Payment Type</span>
                  {isCod ? (
                    <div className="mt-0.5">
                      <span className="text-xs font-black bg-black text-white px-2 py-0.5 rounded uppercase tracking-wider block">
                        COD (CASH)
                      </span>
                      <span className="text-[11px] font-black block mt-0.5">
                        Collect: ₹{codAmount}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-black bg-black text-white px-2.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                      PREPAID
                    </span>
                  )}
                </div>
              </div>

              {/* 3. AWB Barcode Simulation (Code 128 High-Density Stripes) */}
              <div className="py-2.5 px-2 border-b-2 border-black flex flex-col items-center justify-center bg-white">
                <div className="w-full flex justify-center items-center h-10 overflow-hidden gap-[2px]">
                  {[3, 1, 4, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 1, 3, 4, 2, 1, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                    <div 
                      key={idx} 
                      className={`h-full ${idx % 2 === 0 ? "bg-black" : "bg-transparent"}`}
                      style={{ width: `${w * 1.4}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[11px] font-black tracking-widest mt-1 block">
                  AWB: {awb}
                </span>
              </div>

              {/* 4. SHIP TO: Consignee Customer Address */}
              <div className="p-2.5 border-b-2 border-black">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-neutral-500 block">
                    SHIP TO (CONSIGNEE):
                  </span>
                  <span className="text-[10px] font-mono font-bold">
                    Order #{orderNum}
                  </span>
                </div>

                <div className="mt-1">
                  <span className="font-black text-xs sm:text-sm block leading-snug">
                    {customerName}
                  </span>
                  {customerPhone && (
                    <span className="font-mono font-bold text-[11px] block text-neutral-800">
                      Tel: {customerPhone}
                    </span>
                  )}

                  {fullStreet && (
                    <p className="text-[11px] text-neutral-900 font-medium leading-relaxed mt-0.5 break-words">
                      {fullStreet}
                    </p>
                  )}

                  <p className="text-[11px] font-black text-black mt-0.5">
                    {cityStatePin}
                  </p>
                  <p className="text-[9px] font-bold text-neutral-600 uppercase">
                    {country}
                  </p>
                </div>
              </div>

              {/* 5. Package Items Summary */}
              <div className="p-2 border-b-2 border-black text-[10px]">
                <span className="font-bold uppercase text-neutral-500 block mb-0.5 text-[8px]">Package Contents:</span>
                <div className="space-y-0.5">
                  {order.items?.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between font-medium">
                      <span className="truncate max-w-[220px]">• {item.quantity}x {item.name}</span>
                      <span className="font-mono text-neutral-600">{item.sku}</span>
                    </div>
                  ))}
                  {order.items && order.items.length > 3 && (
                    <span className="text-[8px] font-bold text-neutral-500 block">
                      +{order.items.length - 3} more items in this package
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 6. RETURN TO ORIGIN (Dynamic Real Store / Courier Registered Origin - Zero Mock) */}
            <div className="pt-2">
              <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-500 block">
                IF UNDELIVERED, RETURN TO:
              </span>
              <div className="text-[9px] leading-tight text-neutral-800 font-medium mt-0.5">
                <span className="font-bold block">{originName}</span>
                {originStreet ? (
                  <>
                    <span>{originStreet}, </span>
                    {originCityStatePin && <span>{originCityStatePin}</span>}
                  </>
                ) : (
                  <span className="text-neutral-600 block">
                    Registered Pickup Hub on Courier Account ({courierName})
                  </span>
                )}
                
                {(originGstin || originContact) && (
                  <span className="block font-mono text-[8px] mt-0.5">
                    {originGstin && <span>GSTIN: {originGstin}</span>}
                    {originGstin && originContact && <span> | </span>}
                    {originContact && <span>{originContact}</span>}
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions Bar (Sticky, never clips) */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs print:hidden">
          <span className="text-slate-500 text-[11px] text-center sm:text-left">
            Standard 4×6″ format for Zebra, TSC, TVS &amp; standard thermal printers.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-brand text-white font-bold transition-colors shadow-sm"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print 4×6″ Label</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
