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
  onPreOrderCreate?: () => Promise<string | null>;
  isProcessing: boolean;
  shippingAddressSummary?: string;
  isFailedParam?: boolean;
  isCancelledParam?: boolean;
  isCodAvailable?: boolean;
  total?: number;
}

export const CheckoutPaymentStep = ({
  generatedOrderNumber,
  paymentOption,
  setPaymentOption,
  setCurrentStep,
  handleAgreeToPay,
  onPreOrderCreate,
  isProcessing,
  shippingAddressSummary,
  isFailedParam,
  isCancelledParam,
  isCodAvailable = true,
  total
}: CheckoutPaymentStepProps) => {
  const { data: settings, isLoading } = usePublicSettings();
  const snapmintMin = settings?.snapmintMinOrderValue ?? 0;

  const baseGateways = settings?.enabledGateways && settings.enabledGateways.length > 0
    ? settings.enabledGateways
    : ["payu", "ccavenue", "snapmint", "cod"];
    
  const availableGateways = baseGateways.filter(g => (g !== "cod" || isCodAvailable) && g !== "upi" && g !== "gpay");

  const isSnapmintIneligible = snapmintMin > 0 && total !== undefined && total < snapmintMin;

  // Ensure an available and eligible gateway is selected
  React.useEffect(() => {
    const eligibleGateways = availableGateways.filter(
      (g) => g !== "snapmint" || !isSnapmintIneligible
    );
    if (
      eligibleGateways.length > 0 &&
      (!eligibleGateways.includes(paymentOption) || (paymentOption === "snapmint" && isSnapmintIneligible))
    ) {
      setPaymentOption(eligibleGateways[0] as PaymentMethodType);
    }
  }, [availableGateways, paymentOption, setPaymentOption, isSnapmintIneligible]);

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

  const isCodWithAdvance = Boolean(settings?.codPartialPaymentEnabled) && (settings?.codPartialPaymentValue || 0) > 0;

  const codAdvanceText = settings?.codPartialPaymentType === "fixed"
    ? `₹${Number(settings?.codPartialPaymentValue || 0).toLocaleString("en-IN")}`
    : `${settings?.codPartialPaymentValue ?? 10}%`;

  const advanceAmount = React.useMemo(() => {
    if (!isCodWithAdvance || total === undefined || total <= 0) return 0;
    if (settings?.codPartialPaymentType === "fixed") {
      return Math.min(Number(settings?.codPartialPaymentValue || 0), total);
    }
    const pct = Number(settings?.codPartialPaymentValue || 10);
    return Math.round((total * pct) / 100);
  }, [isCodWithAdvance, total, settings?.codPartialPaymentType, settings?.codPartialPaymentValue]);

  const balanceDue = React.useMemo(() => {
    if (total === undefined) return 0;
    return Math.max(0, total - advanceAmount);
  }, [total, advanceAmount]);

  const handleSelectGateway = (method: PaymentMethodType) => {
    if (method === "snapmint" && isSnapmintIneligible) return;
    setPaymentOption(method);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Failure & Cancellation Diagnostic Banners */}
      {(isFailedParam || isCancelledParam) && (
        <>
          {isCancelledParam && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed shadow-xs">
              <span className="font-bold">Payment was cancelled at the gateway.</span> No funds were captured. You can re-attempt payment with any preferred method below.
            </div>
          )}

          {isFailedParam && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 space-y-3 shadow-xs">
              <div className="flex items-start gap-2.5">
                <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="space-y-1">
                  <span className="font-bold text-sm block text-red-950">Payment Unsuccessful or Bank Declined</span>
                  <p className="text-neutral-700 leading-normal">
                    The bank did not authorize this transaction. Your cart has been safely preserved. Please choose another payment method or re-try below.
                  </p>
                </div>
              </div>

              {/* Bank Reconciliation Helper Accordion */}
              <div className="pt-2 border-t border-red-200/80">
                <button
                  type="button"
                  onClick={() => setShowDebitedHelp(!showDebitedHelp)}
                  className="text-xs font-bold text-banner hover:text-orange-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{showDebitedHelp ? "▼ Hide bank reconciliation" : "▶ Was money debited from your bank/UPI?"}</span>
                </button>

                {showDebitedHelp && (
                  <div className="mt-2.5 p-3.5 bg-white border border-red-200 rounded-xl space-y-2 text-neutral-800 animate-in fade-in duration-150">
                    <p className="text-[11px] leading-relaxed">
                      <strong>If money was debited from your bank / UPI:</strong>
                    </p>
                    <p className="text-[11px] text-neutral-600 leading-relaxed">
                      UPI apps (GPay, PhonePe, Paytm) or bank networks sometimes take 1-2 minutes to settle. Click below to verify live status with your bank.
                    </p>
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCheckStatus}
                        disabled={isCheckingStatus}
                        className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        {isCheckingStatus ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Checking with bank...</span>
                          </>
                        ) : (
                          <span>Re-check payment status with Bank</span>
                        )}
                      </button>
                    </div>

                    {statusMessage && (
                      <div className="mt-2 p-2 bg-neutral-50 border border-neutral-200 rounded text-[11px] text-neutral-800 font-mono">
                        {statusMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Payment Container (Clay Card) */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_12px_32px_-6px_rgba(15,23,42,0.05),0_4px_16px_-2px_rgba(15,23,42,0.02),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.015)] border border-slate-100/90 ring-1 ring-slate-900/[0.02] flex flex-col gap-5">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
          <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] flex items-center justify-center">2</span>
            <span>PAYMENT METHOD</span>
          </h2>
          <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-lg mt-0.5">
            Please select your preferred payment method below. All online transactions are secure and encrypted.
          </p>
        </div>

        {/* Delivery Summary with Edit Button */}
        {shippingAddressSummary && (
          <div className="flex items-center justify-between p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)]">
            <div className="flex flex-col gap-0.5 min-w-0 pr-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DELIVERING TO</span>
              <span className="text-xs text-slate-800 font-semibold line-clamp-1">{shippingAddressSummary}</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-banner/50 text-banner font-bold text-xs uppercase px-3.5 py-1.5 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)] transition-all active:translate-y-0.5 shrink-0"
            >
              Edit
            </button>
          </div>
        )}

        {/* Payment Method Gateways */}
        <div className="flex flex-col gap-3.5 pt-1">
          {isLoading ? (
            <div className="p-6 border border-slate-200/80 rounded-2xl animate-pulse bg-slate-50/60 h-28" />
          ) : (
            availableGateways.map((method) => {
              // 1. PayU
              if (method === "payu") {
                const isSelected = paymentOption === "payu";
                return (
                  <label
                    key="payu"
                    onClick={() => handleSelectGateway("payu")}
                    className={`relative flex flex-col p-4 sm:p-5 rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
                      isSelected
                        ? "border-2 border-banner bg-gradient-to-br from-[#fff7f4] via-white to-white shadow-[0_14px_30px_-6px_rgba(255,84,41,0.18),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(255,84,41,0.04)] -translate-y-0.5"
                        : "border border-slate-200/80 bg-white hover:bg-slate-50/50 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${isSelected ? 'border-banner bg-banner shadow-[0_2px_6px_rgba(255,84,41,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'border-slate-300 bg-slate-50 shadow-inner'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                      </div>

                      <div className="flex flex-col w-full">
                        <div className="font-bold text-sm text-neutral-900 w-full flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-bold">PayUMoney - Bajaj EMI, Credit Cards, Net Banking & More</span>
                          </div>
                          <div className="flex items-center ml-auto gap-1.5 shrink-0">
                            <Image src="/icons/payment/payu.svg" alt="PayU" width={40} height={20} className="object-contain h-5 w-auto" priority loading="eager" unoptimized />
                            <Image src="/icons/payment/upi.svg" alt="UPI" width={30} height={16} className="object-contain h-4 w-auto" priority loading="eager" unoptimized />
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-0.5 pr-2">
                          Google Pay, PhonePe, Paytm, Visa, Mastercard, RuPay, NetBanking & Bajaj Finserv EMI
                        </span>

                        {/* Logo Strip */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <div className="bg-white border border-slate-200/80 rounded-xl px-2 py-0.5 flex items-center justify-center h-7 w-[46px] shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
                            <Image src="/icons/payment/gpay.svg" alt="GPay" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl px-2 py-0.5 flex items-center justify-center h-7 w-[46px] shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
                            <Image src="/icons/payment/phonepe.svg" alt="PhonePe" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl px-2 py-0.5 flex items-center justify-center h-7 w-[46px] shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
                            <Image src="/icons/payment/paytm.svg" alt="Paytm" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl px-2 py-0.5 flex items-center justify-center h-7 w-[46px] shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
                            <Image src="/icons/payment/visa.svg" alt="VISA" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl px-2 py-0.5 flex items-center justify-center h-7 w-[46px] shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
                            <Image src="/icons/payment/mastercard.svg" alt="Mastercard" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
                          </div>
                          <div className="bg-white border border-slate-200/80 rounded-xl px-2 py-0.5 flex items-center justify-center h-7 w-[46px] shadow-[0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,1)]">
                            <Image src="/icons/payment/rupay.svg" alt="RuPay" width={40} height={24} className="object-contain w-full h-full" priority loading="eager" unoptimized />
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              }

              // 2. CCAvenue
              if (method === "ccavenue") {
                const isSelected = paymentOption === "ccavenue";
                return (
                  <label
                    key="ccavenue"
                    onClick={() => handleSelectGateway("ccavenue")}
                    className={`relative flex flex-col p-4 sm:p-5 rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
                      isSelected
                        ? "border-2 border-banner bg-gradient-to-br from-[#fff7f4] via-white to-white shadow-[0_14px_30px_-6px_rgba(255,84,41,0.18),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(255,84,41,0.04)] -translate-y-0.5"
                        : "border border-slate-200/80 bg-white hover:bg-slate-50/50 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${isSelected ? 'border-banner bg-banner shadow-[0_2px_6px_rgba(255,84,41,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'border-slate-300 bg-slate-50 shadow-inner'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                      </div>

                      <div className="flex flex-col w-full">
                        <div className="font-bold text-sm text-neutral-900 w-full flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-bold">CCAvenue</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
                              50+ Banks
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <div className="flex items-center bg-[#8f0d14] px-3 py-1 rounded-xl shadow-[0_2px_6px_rgba(143,13,20,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] h-6">
                              <span className="text-white font-black text-[11px] tracking-tight">CCAvenue</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-0.5 pr-2">
                          Credit Cards, Debit Cards, NetBanking (All Major Indian Banks) & Wallets
                        </span>
                      </div>
                    </div>
                  </label>
                );
              }

              // 3. Snapmint
              if (method === "snapmint") {
                const isSelected = paymentOption === "snapmint";
                return (
                  <label
                    key="snapmint"
                    onClick={() => handleSelectGateway("snapmint")}
                    className={`relative flex flex-col p-4 sm:p-5 rounded-2xl transition-all duration-300 overflow-hidden ${
                      isSnapmintIneligible
                        ? "border border-slate-200 bg-slate-50/70 opacity-80 cursor-not-allowed"
                        : isSelected
                        ? "border-2 border-banner bg-gradient-to-br from-[#fff7f4] via-white to-white shadow-[0_14px_30px_-6px_rgba(255,84,41,0.18),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(255,84,41,0.04)] -translate-y-0.5 cursor-pointer"
                        : "border border-slate-200/80 bg-white hover:bg-slate-50/50 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                        isSnapmintIneligible
                          ? 'border-slate-300 bg-slate-200'
                          : isSelected 
                          ? 'border-banner bg-banner shadow-[0_2px_6px_rgba(255,84,41,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]' 
                          : 'border-slate-300 bg-slate-50 shadow-inner'
                      }`}>
                        {isSelected && !isSnapmintIneligible && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                      </div>

                      <div className="flex flex-col w-full">
                        <div className="font-bold text-sm text-neutral-900 w-full flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-bold">Snapmint - EMI without Credit Card</span>
                            {snapmintMin > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-2xs tracking-wide uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                Min. Order ₹{snapmintMin.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 scale-95 origin-right">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center bg-[#004851] px-2.5 py-1 rounded-xl shadow-[0_2px_6px_rgba(0,72,81,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] h-7">
                                <span className="text-[#00e396] font-bold text-xs tracking-tight">snap</span>
                                <span className="text-white font-bold text-xs tracking-tight">mint</span>
                              </div>
                              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs">0% Interest</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-0.5 pr-2">
                          Buy now, pay in easy monthly installments without credit card
                        </span>

                        {/* Snapmint Ineligible notice */}
                        {isSnapmintIneligible && (
                          <div className="mt-3 flex items-start gap-2.5 p-3.5 bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-2xl text-xs leading-relaxed shadow-[inset_0_1px_2px_rgba(245,158,11,0.05)]">
                            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <span className="font-bold">Order value ₹{Number(total).toLocaleString("en-IN")} is below Snapmint&apos;s minimum limit (₹{snapmintMin.toLocaleString("en-IN")}).</span>{" "}
                              <span className="text-neutral-700">Add <strong>₹{(snapmintMin - total).toLocaleString('en-IN')}</strong> more to your cart to unlock 0% EMI with Snapmint.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              }

              // 4. Cash on Delivery (COD)
              if (method === "cod") {
                const isSelected = paymentOption === "cod";
                return (
                  <label
                    key="cod"
                    onClick={() => handleSelectGateway("cod")}
                    className={`relative flex flex-col p-4 sm:p-5 rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer ${
                      isSelected
                        ? "border-2 border-banner bg-gradient-to-br from-[#fff7f4] via-white to-white shadow-[0_14px_30px_-6px_rgba(255,84,41,0.18),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-2px_4px_rgba(255,84,41,0.04)] -translate-y-0.5"
                        : "border border-slate-200/80 bg-white hover:bg-slate-50/50 shadow-[0_4px_14px_-2px_rgba(0,0,0,0.04),inset_0_1.5px_0_rgba(255,255,255,1)] hover:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.07)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 ${isSelected ? 'border-banner bg-banner shadow-[0_2px_6px_rgba(255,84,41,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]' : 'border-slate-300 bg-slate-50 shadow-inner'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                      </div>

                      <div className="flex flex-col w-full">
                        <div className="font-bold text-sm text-neutral-900 w-full flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-sans font-bold">Cash on Delivery | COD</span>
                            {isCodWithAdvance && (
                              <span className="text-[10px] font-bold bg-[#EBF4FF] text-[#2874F0] border border-[#C7D9FF] px-2.5 py-0.5 rounded-full tracking-wide shadow-2xs">
                                {codAdvanceText} Advance
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 scale-95 origin-right">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1 bg-neutral-900 text-white px-2.5 py-1 rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] h-7">
                                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="6" width="20" height="12" rx="2" />
                                  <circle cx="12" cy="12" r="2" />
                                  <path d="M6 12h.01M18 12h.01" />
                                </svg>
                                <span className="font-extrabold text-[11px] tracking-wider uppercase">COD</span>
                              </div>
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">Doorstep</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-500 mt-0.5 pr-2">
                          Pay in cash or UPI when package is delivered at your doorstep
                        </span>

                        {/* Advance Payment Banner */}
                        {isCodWithAdvance && (
                          <div className="mt-3 flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[#F0F5FF] border border-[#D0E1FD] rounded-2xl text-xs text-[#172337] shadow-[inset_0_1px_2px_rgba(40,116,240,0.04)]">
                            <div className="flex items-center gap-2 min-w-0">
                              <svg className="w-4 h-4 text-[#2874F0] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                              </svg>
                              <p className="text-[12px] leading-snug text-[#1E293B]">
                                for <strong className="font-bold text-[#2874F0]">{codAdvanceText} advance payment</strong> you will be directed to <strong className="font-bold text-neutral-900">Payu Payment Gateway</strong>
                              </p>
                            </div>
                            <div className="shrink-0 hidden sm:flex items-center bg-white px-2 py-0.5 border border-[#D0E1FD] rounded-lg shadow-2xs h-5">
                              <Image src="/icons/payment/payu.svg" alt="PayU" width={30} height={14} className="object-contain h-3.5 w-auto" priority loading="eager" unoptimized />
                            </div>
                          </div>
                        )}

                        {/* COD Advance payment live breakdown (when selected) */}
                        {isCodWithAdvance && isSelected && total !== undefined && total > 0 && advanceAmount > 0 && (
                          <div className="mt-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs text-neutral-800 flex flex-wrap items-center justify-between gap-3 shadow-[inset_0_2px_4px_rgba(15,23,42,0.02)] animate-in fade-in duration-200">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-[#F0F5FF] border border-[#D0E1FD] flex items-center justify-center shrink-0 shadow-2xs">
                                <svg className="w-4 h-4 text-[#2874F0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="5" width="20" height="14" rx="2" />
                                  <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-neutral-500 uppercase font-semibold">Advance via PayU</span>
                                <strong className="text-banner font-black text-sm">₹{advanceAmount.toLocaleString("en-IN")}</strong>
                              </div>
                            </div>

                            <div className="text-slate-300 font-light text-base hidden sm:block">→</div>

                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                                <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                      </div>
                    </div>
                  </label>
                );
              }

              return null;
            })
          )}
        </div>

        {/* Desktop Back Navigation */}
        <div className="hidden lg:flex items-center justify-start pt-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="border border-slate-200 hover:border-slate-800 bg-white text-slate-700 hover:text-slate-900 text-xs uppercase font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-[0_2px_6px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,1)] active:translate-y-0.5 cursor-pointer"
          >
            ← Back to Shipping Details
          </button>
        </div>
      </div>

      {/* Mobile Fixed Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-[60] flex flex-col gap-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] lg:hidden">
        {paymentOption === "cod" && Boolean(settings?.codPartialPaymentEnabled) && (settings?.codPartialPaymentValue || 0) > 0 && (
          <div className="w-full text-xs text-[#172337] bg-[#F0F5FF] border border-[#D0E1FD] px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-2xs leading-snug">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-[#2874F0] shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <span className="text-[11.5px] text-[#1E293B]">
                for <strong className="font-bold text-[#2874F0]">{codAdvanceText} advance payment</strong> you will be directed to <strong className="font-bold text-neutral-900">Payu Payment Gateway</strong>
              </span>
            </div>
            <div className="shrink-0 flex items-center bg-white px-2 py-0.5 border border-[#D0E1FD] rounded shadow-2xs h-5">
              <Image src="/icons/payment/payu.svg" alt="PayU" width={26} height={12} className="object-contain h-3 w-auto" priority loading="eager" unoptimized />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Total Display */}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total</span>
            <span className="text-xl font-black text-banner leading-none line-clamp-1">
              {total !== undefined ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(total) : "₹0.00"}
            </span>
          </div>

          {/* Continue Button on Mobile */}
          <button
            type="button"
            onClick={handleAgreeToPay}
            disabled={isProcessing || !paymentOption}
            className="flex-1 bg-gradient-to-r from-banner to-[#ea4719] hover:from-[#f04f25] hover:to-[#d83c12] text-white font-black tracking-wider text-xs uppercase py-3.5 px-6 rounded-xl shadow-[0_8px_20px_-4px_rgba(255,84,41,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] transition-all active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            {isProcessing ? "PROCESSING..." : "PLACE ORDER"}
          </button>
        </div>
      </div>

    </div>
  );
};
