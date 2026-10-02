import React from "react";
import Image from "next/image";
import { PaymentMethodType } from "@store4riders/shared-types";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";

interface CheckoutPaymentStepProps {
  generatedOrderNumber: string;
  paymentOption: PaymentMethodType;
  setPaymentOption: (option: PaymentMethodType) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  handleAgreeToPay: () => void;
  isProcessing: boolean;
  shippingAddressSummary?: string;
  isFailedParam?: boolean;
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
  isCodAvailable = true,
  total
}: CheckoutPaymentStepProps) => {
  const { data: settings, isLoading } = usePublicSettings();

  const GATEWAY_INFO: Record<string, { label: React.ReactNode; desc: string; icon: React.ReactNode }> = {
    payu: {
      label: (
        <div className="flex items-center gap-2 flex-wrap">
          <span>PayU & UPI</span>
          <div className="flex items-center ml-auto gap-1">
            <Image src="/icons/payment/payu.svg?v=4" alt="PayU" width={40} height={20} className="object-contain h-5 w-auto" unoptimized />
            <Image src="/icons/payment/upi.svg?v=3" alt="UPI" width={30} height={16} className="object-contain h-4 w-auto" unoptimized />
          </div>
        </div>
      ),
      desc: "Google Pay, PhonePe, Paytm, Cards & NetBanking",
            icon: (
        <div className="flex items-center gap-2 mt-2 flex-wrap opacity-90">
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/gpay.svg?v=3" alt="GPay" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/phonepe.svg?v=3" alt="PhonePe" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/paytm.svg?v=3" alt="Paytm" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/visa.svg?v=6" alt="VISA" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/mastercard.svg?v=5" alt="Mastercard" width={40} height={24} className="object-contain w-full h-full" unoptimized />
          </div>
          <div className="bg-white border border-neutral-200 rounded px-1.5 py-0.5 flex items-center justify-center h-7 w-[46px]">
            <Image src="/icons/payment/rupay.svg?v=4" alt="RuPay" width={40} height={24} className="object-contain w-full h-full" unoptimized />
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
      label: "Snapmint (Cardless 0% EMI)",
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
      label: "Cash on Delivery (COD)",
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
          <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">Doorstep</span>
        </div>
      )
    }
  };

  const baseGateways = settings?.enabledGateways && settings.enabledGateways.length > 0
    ? settings.enabledGateways
    : ["payu", "ccavenue", "snapmint", "cod"];
    
  const availableGateways = baseGateways.filter(g => g !== "cod" || isCodAvailable);

  // Ensure an available gateway is selected
  React.useEffect(() => {
    if (availableGateways.length > 0 && !availableGateways.includes(paymentOption)) {
      setPaymentOption(availableGateways[0] as PaymentMethodType);
    }
  }, [availableGateways, paymentOption, setPaymentOption]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Alert banner if redirected back after cancel/failure */}
      {isFailedParam && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-amber-600">⚠️</span>
            <span>Your previous payment attempt was cancelled or unsuccessful. <strong>Your cart items are completely safe.</strong> Please choose your preferred payment method below to complete your order.</span>
          </div>
        </div>
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
            onClick={() => setCurrentStep(2)}
            className="text-xs font-bold text-banner hover:text-orange-600 uppercase tracking-wider px-2 py-1 shrink-0"
          >
            Edit
          </button>
        </div>
      )}

      {/* Gateway Options */}
      <div className="flex flex-col gap-3 pt-1">
        {isLoading ? (
          <div className="p-4 border border-neutral-200 animate-pulse bg-neutral-50 h-24" />
        ) : (
          availableGateways.map((method) => {
            const info = GATEWAY_INFO[method];
            if (!info) return null;
            
            const isCodWithAdvance = method === "cod" && Boolean(settings?.codPartialPaymentEnabled) && Boolean(settings?.codPartialPaymentValue) && (settings?.codPartialPaymentValue || 0) > 0;
            const isSelected = paymentOption === method;

            return (
              <label
                key={method}
                onClick={() => setPaymentOption(method as PaymentMethodType)}
                className={`relative flex flex-col p-4 border rounded-none cursor-pointer transition-all overflow-hidden ${
                  isSelected
                    ? "border-banner bg-orange-50/20 ring-1 ring-banner"
                    : "border-neutral-300 hover:border-neutral-400 bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentOption"
                    checked={isSelected}
                    onChange={() => setPaymentOption(method as PaymentMethodType)}
                    className="accent-orange-600 w-4 h-4 cursor-pointer mt-0.5 shrink-0"
                  />
                  <div className="flex flex-col w-full">
                    <div className="font-bold text-sm text-neutral-900 w-full flex items-center justify-between">
                      {info.label}
                      {method !== "payu" && <div className="shrink-0 scale-90 origin-right">{info.icon}</div>}
                    </div>
                    <span className="text-[11px] text-neutral-500 mt-0.5 pr-2">
                      {isCodWithAdvance 
                        ? `${info.desc} (Requires ${settings?.codPartialPaymentType === 'fixed' ? '₹' + settings?.codPartialPaymentValue : settings?.codPartialPaymentValue + '%'} advance)` 
                        : info.desc}
                    </span>
                    {method === "payu" && info.icon}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-white border-t border-neutral-200 z-[60] flex items-center justify-between gap-4 shadow-[0_-8px_16px_-6px_rgba(0,0,0,0.15)] lg:relative lg:p-0 lg:pb-0 lg:border-t-0 lg:z-auto lg:shadow-none lg:bg-transparent">
        {/* Mobile Total Display */}
        <div className="flex flex-col lg:hidden min-w-0">
          <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total</span>
          <span className="text-lg font-black text-[#AB1509] leading-none line-clamp-1">
            {total !== undefined ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(total) : "₹0.00"}
          </span>
        </div>

        {/* Back Button (Desktop Only) */}
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="hidden lg:flex border border-neutral-300 hover:border-neutral-900 text-neutral-700 hover:text-neutral-900 text-xs uppercase font-bold px-5 py-3.5 transition-colors items-center gap-1.5"
        >
          ← Back
        </button>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleAgreeToPay}
          disabled={isProcessing || !paymentOption}
          className="flex-1 lg:flex-none lg:w-auto bg-banner hover:bg-orange-600 text-white font-bold tracking-wider text-xs uppercase py-3.5 lg:py-4 px-4 md:px-12 rounded-none shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap lg:self-start"
        >
          {isProcessing ? "PROCESSING..." : "PLACE ORDER"}
        </button>
      </div>

    </div>
  );
};
