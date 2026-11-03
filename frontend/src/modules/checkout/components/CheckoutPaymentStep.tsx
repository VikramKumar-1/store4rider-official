import React from "react";
import Image from "next/image";
import { PaymentMethodType } from "@store4riders/shared-types";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { toast } from "sonner";
import { apiClient } from "@/core/api/client";

interface CheckoutPaymentStepProps {
  generatedOrderNumber: string;
  paymentOption: PaymentMethodType;
  setPaymentOption: (option: PaymentMethodType) => void;
  setCurrentStep: (step: 1 | 2) => void;
  handleAgreeToPay: () => void;
  isProcessing: boolean;
  shippingAddressSummary?: string;
  isFailedParam?: boolean;
  isCancelledParam?: boolean;
  isCodAvailable?: boolean;
  total?: number;
}

// Authentic Brand Vector Logos
const UpiLogo = () => (
  <div className="flex items-center justify-center bg-white px-2.5 py-0.5 border border-neutral-200 rounded shadow-xs h-7 shrink-0">
    <img 
      src="/upi.svg" 
      alt="UPI" 
      className="h-4.5 w-auto object-contain max-h-[18px]" 
    />
  </div>
);

export const CheckoutPaymentStep = ({
  generatedOrderNumber,
  paymentOption,
  setPaymentOption,
  setCurrentStep,
  handleAgreeToPay,
  isProcessing,
  shippingAddressSummary,
  isFailedParam,
  isCancelledParam,
  isCodAvailable = true,
  total
}: CheckoutPaymentStepProps) => {
  const { data: settings, isLoading } = usePublicSettings();
  const snapmintMin = settings?.snapmintMinOrderValue ?? 0;

  const GATEWAY_INFO: Record<string, { label: React.ReactNode; desc: string; icon: React.ReactNode }> = {
    payu: {
      label: (
        <div className="flex items-center gap-2 flex-wrap">
          <span>PayU & UPI</span>
          <div className="flex items-center ml-auto gap-1">
            <Image src="/icons/payment/payu.svg" alt="PayU" width={40} height={20} className="object-contain h-5 w-auto" priority loading="eager" unoptimized />
            <Image src="/icons/payment/upi.svg" alt="UPI" width={30} height={16} className="object-contain h-4 w-auto" priority loading="eager" unoptimized />
          </div>
        </div>
      ),
      desc: "Google Pay, PhonePe, Paytm, Cards & NetBanking",
      icon: (
        <div className="flex items-center gap-2 mt-2 flex-wrap opacity-90">
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/gpay.svg" alt="GPay" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/phonepe.svg" alt="PhonePe" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/paytm.svg" alt="Paytm" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/visa.svg" alt="VISA" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/mastercard.svg" alt="Mastercard" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/rupay.svg" alt="RuPay" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
          </div>
        </div>
      )
    },
    ccavenue: {
      label: "NetBanking & EMI (CCAvenue)",
      desc: "All Major Indian Banks & Flexible EMI options",
      icon: (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#8f0d14] px-2.5 py-1 rounded shadow-xs h-7">
            <span className="text-white font-black text-xs tracking-tight">CCAvenue</span>
          </div>
          <span className="text-[9px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">50+ Banks</span>
        </div>
      )
    },
    snapmint: {
      label: (
        <div className="flex items-center gap-2 flex-wrap">
          <span>Snapmint (Cardless 0% EMI)</span>
          {snapmintMin > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded shadow-2xs tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              Min. Order ₹{snapmintMin.toLocaleString("en-IN")}
            </span>
          )}
        </div>
      ),
      desc: "Buy now, pay in easy monthly installments without credit card",
      icon: (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-[#004851] px-2.5 py-1 rounded shadow-xs h-7">
            <span className="text-[#00e396] font-bold text-xs tracking-tight">snap</span>
            <span className="text-white font-bold text-xs tracking-tight">mint</span>
          </div>
          <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">0% Interest</span>
        </div>
      )
    },
    cod: {
      label: (
        <div className="flex items-center gap-2 flex-wrap">
          <span>Cash on Delivery (COD)</span>
          {Boolean(settings?.codPartialPaymentEnabled) && (settings?.codPartialPaymentValue || 0) > 0 && (
            <span className="text-[10px] font-bold bg-[#EBF4FF] text-[#2874F0] border border-[#C7D9FF] px-2 py-0.5 rounded tracking-wide">
              {settings?.codPartialPaymentType === "fixed" ? `₹${Number(settings?.codPartialPaymentValue || 0).toLocaleString("en-IN")}` : `${settings?.codPartialPaymentValue ?? 10}%`} Advance
            </span>
          )}
        </div>
      ),
      desc: "Pay in cash or UPI when package is delivered at your doorstep",
      icon: (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 bg-neutral-900 text-white px-2.5 py-1 rounded shadow-xs h-7">
            <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
            <span className="font-extrabold text-[11px] tracking-wider uppercase">COD</span>
          </div>
          <span className="text-[9px] font-medium bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded border border-neutral-200">Doorstep</span>
        </div>
      )
    }
  };

  const baseGateways = settings?.enabledGateways && settings.enabledGateways.length > 0
    ? settings.enabledGateways
    : ["payu", "ccavenue", "snapmint", "cod"];
    
  const availableGateways = baseGateways.filter(g => g !== "cod" || isCodAvailable);

  // Ensure an available and eligible gateway is selected
  React.useEffect(() => {
    const isSnapmintIneligible = snapmintMin > 0 && total !== undefined && total < snapmintMin;
    const eligibleGateways = availableGateways.filter(
      (g) => g !== "snapmint" || !isSnapmintIneligible
    );
    if (
      eligibleGateways.length > 0 &&
      (!eligibleGateways.includes(paymentOption) || (paymentOption === "snapmint" && isSnapmintIneligible))
    ) {
      setPaymentOption(eligibleGateways[0] as PaymentMethodType);
    }
  }, [availableGateways, paymentOption, setPaymentOption, total, snapmintMin]);

  const [isCheckingStatus, setIsCheckingStatus] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [showDebitedHelp, setShowDebitedHelp] = React.useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = React.useState(false);

  const handleCheckStatus = async () => {
    if (!generatedOrderNumber) {
      toast.error("No active order reference found to check status.");
      return;
    }
    try {
      setIsCheckingStatus(true);
      const res = await apiClient.post("/orders/sync-payment", { orderId: generatedOrderNumber });
      const result = res.data?.data;
      if (result?.isConfirmed) {
        setIsVerifiedSuccess(true);
        toast.success(result.message || "Payment verified with bank! Your order is confirmed.");
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = `/checkout?success=true&orderId=${encodeURIComponent(result.orderNumber || generatedOrderNumber)}`;
          }
        }, 800);
      } else {
        setStatusMessage(result?.message || "Bank has not confirmed any payment for this order yet. If debited, funds will auto-reverse within 24-48 hours.");
        toast.info(result?.message || "No captured payment received from bank yet.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Could not check payment status. Please try again.");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      
      {/* Alert banner if redirected back after cancel/incomplete payment */}
      {(isFailedParam || isCancelledParam) && (
        <>
          {isVerifiedSuccess ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 flex items-center gap-3 shadow-xs animate-in fade-in">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
                ✓
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-emerald-950">Payment Verified with Bank!</span>
                <p className="text-xs text-emerald-800">Your order has been confirmed successfully. Redirecting to your confirmation receipt...</p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/80 border border-amber-300/80 rounded-lg p-4 flex flex-col gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0 leading-none mt-0.5">ℹ️</span>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      {isCancelledParam ? "Payment Cancelled" : "Payment Incomplete or Cancelled"}
                    </span>
                    {generatedOrderNumber && (
                      <span className="text-[11px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                        Ref: {generatedOrderNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-sans">
                    {isCancelledParam
                      ? "You cancelled the payment transaction. "
                      : "Your previous payment attempt was cancelled or could not be completed. "}
                    Don&apos;t worry, <strong>all your items are still safely in your cart</strong>. You can simply retry or select another payment method below.
                  </p>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-amber-200/70">
                <button
                  type="button"
                  onClick={() => setShowDebitedHelp((prev) => !prev)}
                  className="text-xs font-medium text-amber-900 hover:text-amber-950 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showDebitedHelp ? "▲ Hide bank reconciliation" : "▼ Was money debited from your bank/UPI?"}</span>
                </button>

                <a
                  href={`https://wa.me/918789494263?text=${encodeURIComponent(`Hi Store4Riders, my payment was cancelled/incomplete for Order Ref ${generatedOrderNumber}. Please assist.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded transition-colors flex items-center gap-1 ml-auto shadow-2xs"
                >
                  <span>💬 Need Help? WhatsApp Support</span>
                </a>
              </div>

              {/* Collapsible section ONLY if money was debited / user requested reconciliation */}
              {showDebitedHelp && (
                <div className="flex flex-col gap-3 pt-2 mt-1 border-t border-amber-200/70 animate-in fade-in">
                  <div className="p-3 bg-white rounded-lg border border-amber-200 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                      <span className="text-sm">💸</span>
                      <span>If money was debited from your bank / UPI:</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      UPI apps (GPay, PhonePe, Paytm) or bank networks sometimes take 1–2 minutes to settle. Click below to verify live status with your bank.
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={isCheckingStatus}
                      className="self-start bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      <span className={isCheckingStatus ? "animate-spin inline-block" : ""}>🔄</span>
                      <span>{isCheckingStatus ? "Checking Live Bank Status..." : "Re-Check Bank Status"}</span>
                    </button>

                    {statusMessage && (
                      <div className="p-2.5 mt-1 bg-amber-50/70 border border-amber-200 rounded text-xs text-neutral-800 font-medium">
                        {statusMessage}
                      </div>
                    )}
                  </div>

                  {/* Real RBI Timeline Breakdown */}
                  <div className="bg-white/90 border border-amber-200 rounded p-3 text-[11px] text-neutral-700 flex flex-col gap-1.5">
                    <span className="font-bold text-neutral-900 flex items-center gap-1">
                      <span>🏛️</span> RBI Mandated Auto-Reversal Timelines (If Money Debited):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="bg-amber-50/50 p-2 rounded border border-amber-100 flex flex-col">
                        <span className="font-bold text-neutral-900">⚡ UPI / GPay / PhonePe</span>
                        <span className="text-neutral-600">Reversal within <strong>24 to 48 Hours</strong></span>
                      </div>
                      <div className="bg-amber-50/50 p-2 rounded border border-amber-100 flex flex-col">
                        <span className="font-bold text-neutral-900">💳 Debit / Credit Cards</span>
                        <span className="text-neutral-600">Reversal within <strong>3 to 5 Working Days</strong></span>
                      </div>
                      <div className="bg-amber-50/50 p-2 rounded border border-amber-100 flex flex-col">
                        <span className="font-bold text-neutral-900">🏦 NetBanking</span>
                        <span className="text-neutral-600">Reversal within <strong>2 to 4 Working Days</strong></span>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-500 italic mt-0.5">
                      *As per RBI Circular DPSS.CO.PD No.629/02.01.014/2019-20, banks automatically credit back uncaptured funds without manual claims.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
          PAYMENT METHOD
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-lg">
          Please select your preferred payment method below. All online transactions are secure and encrypted.
        </p>
      </div>

      {/* Delivery Summary with Edit Button */}
      {shippingAddressSummary && (
        <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">DELIVERING TO</span>
            <span className="text-xs text-neutral-800 font-medium line-clamp-1">{shippingAddressSummary}</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="text-xs font-bold text-banner hover:text-orange-600 uppercase tracking-wider px-2 py-1 shrink-0"
          >
            Edit
          </button>
        </div>
      )}

      {/* Gateway Options */}
      <div className="flex flex-col gap-2.5 pt-1">
        {isLoading ? (
          <div className="p-4 border border-neutral-200 animate-pulse bg-neutral-50 h-24" />
        ) : (
          availableGateways.map((method) => {
            const info = GATEWAY_INFO[method];
            if (!info) return null;
            
            const isSnapmint = method === "snapmint";
            const isSnapmintIneligible = isSnapmint && snapmintMin > 0 && total !== undefined && total < snapmintMin;
            const isCodWithAdvance = method === "cod" && Boolean(settings?.codPartialPaymentEnabled) && (settings?.codPartialPaymentValue || 0) > 0;
            const isSelected = paymentOption === method;

            const codAdvanceText = settings?.codPartialPaymentType === "fixed"
              ? `₹${Number(settings?.codPartialPaymentValue || 0).toLocaleString("en-IN")}`
              : `${settings?.codPartialPaymentValue ?? 10}%`;

            const advanceAmount = total !== undefined && total > 0
              ? settings?.codPartialPaymentType === "fixed"
                ? Math.min(total, Number(settings?.codPartialPaymentValue || 0))
                : Math.round((total * Number(settings?.codPartialPaymentValue || 10)) / 100)
              : 0;

            const balanceDue = total !== undefined && total > 0
              ? Math.max(0, total - advanceAmount)
              : 0;

            const handleSelectMethod = () => {
              if (isSnapmintIneligible) {
                toast.error(
                  `Snapmint Cardless EMI requires a minimum order of ₹${snapmintMin.toLocaleString("en-IN")} (Current total: ₹${Number(total).toLocaleString("en-IN")})`
                );
                return;
              }
              setPaymentOption(method as PaymentMethodType);
            };

            return (
              <label
                key={method}
                onClick={handleSelectMethod}
                className={`relative flex flex-col p-3.5 border rounded-none transition-all overflow-hidden ${
                  isSnapmintIneligible
                    ? "border-neutral-200 bg-neutral-50/70 opacity-80 cursor-not-allowed"
                    : isSelected
                    ? "border-banner bg-orange-50/20 ring-1 ring-banner cursor-pointer"
                    : "border-neutral-300 hover:border-neutral-400 bg-white cursor-pointer"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentOption"
                    disabled={isSnapmintIneligible}
                    checked={isSelected}
                    onChange={handleSelectMethod}
                    className={`accent-orange-600 w-4 h-4 mt-0.5 shrink-0 ${
                      isSnapmintIneligible ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    }`}
                  />
                  <div className="flex flex-col w-full">
                    <div className="font-bold text-sm text-neutral-900 w-full flex items-center justify-between">
                      {info.label}
                      {method !== "payu" && <div className="shrink-0 scale-90 origin-right">{info.icon}</div>}
                    </div>
                    <span className="text-[11px] text-neutral-500 mt-0.5 pr-2">
                      {info.desc}
                    </span>

                    {/* Flipkart-style Highlight Ticker Strip */}
                    {method === "cod" && isCodWithAdvance && (
                      <div className="mt-2.5 flex items-center justify-between gap-2.5 px-3 py-2 bg-[#F0F5FF] border border-[#D0E1FD] rounded text-xs text-[#172337]">
                        <div className="flex items-center gap-2 min-w-0">
                          <svg className="w-4 h-4 text-[#2874F0] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-[12px] leading-snug text-[#1E293B]">
                            for <strong className="font-bold text-[#2874F0]">{codAdvanceText} advance payment</strong> you will be directed to <strong className="font-bold text-neutral-900">Payu Payment Gateway</strong>
                          </p>
                        </div>
                        <div className="shrink-0 hidden sm:flex items-center bg-white px-1.5 py-0.5 border border-[#D0E1FD] rounded shadow-2xs h-5">
                          <Image src="/icons/payment/payu.svg" alt="PayU" width={30} height={14} className="object-contain h-3.5 w-auto" priority loading="eager" unoptimized />
                        </div>
                      </div>
                    )}

                    {/* Snapmint Ineligible notice */}
                    {isSnapmintIneligible && (
                      <div className="mt-2.5 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded text-xs leading-relaxed">
                        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <span className="font-bold">Order value ₹{Number(total).toLocaleString("en-IN")} is below Snapmint's minimum limit (₹{snapmintMin.toLocaleString("en-IN")}).</span>{" "}
                          <span className="text-neutral-700">Add <strong>₹{(snapmintMin - total).toLocaleString('en-IN')}</strong> more to your cart to unlock 0% Cardless EMI with Snapmint.</span>
                        </div>
                      </div>
                    )}

                    {/* COD Advance payment live breakdown (when selected) */}
                    {method === "cod" && isCodWithAdvance && isSelected && total !== undefined && total > 0 && advanceAmount > 0 && (
                      <div className="mt-2.5 p-3 bg-neutral-50/80 border border-neutral-200 rounded text-xs text-neutral-800 flex flex-wrap items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#F0F5FF] border border-[#D0E1FD] flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-[#2874F0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <line x1="2" y1="10" x2="22" y2="10" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Advance via PayU</span>
                            <strong className="text-banner font-black text-sm">₹{advanceAmount.toLocaleString("en-IN")}</strong>
                          </div>
                        </div>

                        <div className="text-neutral-300 font-light text-base hidden sm:block">→</div>

                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                            <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 3h12" />
                              <path d="M6 8h12" />
                              <path d="m6 13 8.5 8" />
                              <path d="M6 13h3" />
                              <path d="M9 13c6.667 0 6.667-10 0-10" />
                            </svg>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-neutral-500 uppercase font-semibold">Balance on Delivery</span>
                            <strong className="text-emerald-700 font-black text-sm">₹{balanceDue.toLocaleString("en-IN")}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    

                    {method === "payu" && info.icon}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Desktop Back Navigation */}
      <div className="hidden lg:flex items-center justify-start pt-2">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="border border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 text-xs uppercase font-bold px-5 py-3 transition-colors flex items-center gap-1.5"
        >
          ← Back to Shipping Details
        </button>
      </div>

      {/* Mobile Fixed Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white border-t border-neutral-200 z-[60] flex flex-col gap-2.5 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.15)] lg:hidden">
        {paymentOption === "cod" && Boolean(settings?.codPartialPaymentEnabled) && (settings?.codPartialPaymentValue || 0) > 0 && (
          <div className="w-full text-xs text-[#172337] bg-[#F0F5FF] border border-[#D0E1FD] px-3 py-2 rounded flex items-center justify-between gap-2 shadow-2xs leading-snug">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-[#2874F0] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <span className="text-[11.5px] text-[#1E293B]">
                for <strong className="font-bold text-[#2874F0]">{settings?.codPartialPaymentType === "fixed" ? `₹${Number(settings?.codPartialPaymentValue || 0).toLocaleString("en-IN")}` : `${settings?.codPartialPaymentValue ?? 10}%`} advance payment</strong> you will be directed to <strong className="font-bold text-neutral-900">Payu Payment Gateway</strong>
              </span>
            </div>
            <div className="shrink-0 flex items-center bg-white px-1.5 py-0.5 border border-[#D0E1FD] rounded shadow-2xs h-4.5">
              <Image src="/icons/payment/payu.svg" alt="PayU" width={26} height={12} className="object-contain h-3 w-auto" priority loading="eager" unoptimized />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Total Display */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total</span>
            <span className="text-lg font-black text-banner leading-none line-clamp-1">
              {total !== undefined ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(total) : "₹0.00"}
            </span>
          </div>

          {/* Continue Button on Mobile */}
          <button
            type="button"
            onClick={handleAgreeToPay}
            disabled={isProcessing || !paymentOption}
            className="flex-1 bg-banner hover:bg-orange-600 text-white font-bold tracking-wider text-xs uppercase py-3.5 px-6 rounded-none shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isProcessing ? "PROCESSING..." : "PLACE ORDER"}
          </button>
        </div>
      </div>

    </div>
  );
};
