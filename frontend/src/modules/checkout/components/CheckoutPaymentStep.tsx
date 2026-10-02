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

const GooglePayLogo = () => (
  <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded px-2 py-0.5 shadow-xs h-7 shrink-0">
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
    </svg>
    <span className="text-[14px] font-bold text-neutral-800 tracking-tight leading-none">Pay</span>
  </div>
);

const PhonePeLogo = () => (
  <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded px-2 py-0.5 shadow-xs h-7 shrink-0">
    <svg className="w-4 h-4 shrink-0" viewBox="215 270 250 250">
      <path fill="#5f259f" d="M332.63 514.18c-3.88-.38-7.78-.64-11.64-1.15-25.26-3.35-47.76-13.07-67.18-29.6a127.87 127.87 0 0 1-41.44-65.75 124.29 124.29 0 0 1-3.78-42.55c2-24.95 10.33-47.61 25.5-67.51 21.24-27.87 49.33-44.9 84-50.05 37.84-5.63 72 3.92 101.51 28.13 25.43 20.83 40.77 47.94 45.43 80.46 5.5 38.35-4.36 72.79-29.38 102.44-21.07 25-48.24 39.43-80.53 44.3-4.05.62-8.16.86-12.24 1.28zm-23.78-171c-10.43 0-20.85 0-31.28 0-2.78 0-3.77.84-4 3.58a35.11 35.11 0 0 0 .15 8 9.19 9.19 0 0 0 9.18 8.06c2.4.05 4.8 0 7.2 0 3 0 3 0 3 2.95q0 16.75 0 33.5a50.67 50.67 0 0 0 1.73 13.2c3.21 12 10.21 20.59 22.36 24.17 10.15 3 20.34 2.27 30.36-1 2.35-.77 2.39-.77 2.4 1.72 0 6.92-.05 13.84 0 20.76a11.07 11.07 0 0 0 11.25 11.22c3.29 0 6.59.06 9.88 0a4.2 4.2 0 0 0 4.29-4.3c0-.82 0-1.64 0-2.46q0-48.42 0-96.81c0-3.68 0-3.68 3.58-3.68 4.18 0 8.37 0 12.55 0 3.1 0 4-.95 4-4.1q0-3.07 0-6.17c-.07-5.6-3.83-9.33-9.48-9.38q-7.41-.06-14.81 0a4 4 0 0 1-3.41-1.51c-1.85-2.2-3.77-4.35-5.66-6.51Q346 315.77 329.79 297.18a13.29 13.29 0 0 0-10.6-5c-6.67.08-12.59 3-18.74 5.07-1.87.62-2.07 3-.76 4.5a20 20 0 0 0 1.46 1.45Q321.07 322.11 341 341c.48.45 1.36.88 1.14 1.57-.28.9-1.29.53-2 .53-10.43 0-20.85 0-31.28 0"/>
      <path fill="#5f259f" d="M350,388.34c0,7.61-.05,15.21,0,22.81a3,3,0,0,1-2.31,3.3,36.61,36.61,0,0,1-15.21,1.84c-8.75-.83-13.64-6-14.38-14.87-.68-8.14-.18-16.29-.32-24.44-.06-4,0-7.94,0-11.91,0-1.65.54-2.32,2.27-2.31,9.19.06,18.38.08,27.56,0,2,0,2.42.81,2.41,2.58-.06,7.67,0,15.34,0,23"/>
    </svg>
    <span className="text-[14px] font-bold text-[#5f259f] tracking-tight leading-none">PhonePe</span>
  </div>
);

const PaytmLogo = () => (
  <div className="flex items-center bg-white border border-neutral-200 rounded px-2 py-0.5 shadow-xs h-7 shrink-0">
    <span className="text-[13px] font-black tracking-tight leading-none">
      <span className="text-[#002970]">Pay</span>
      <span className="text-[#00BAF2]">tm</span>
    </span>
  </div>
);

const PayULogo = () => (
  <div className="flex items-center bg-[#1B1B1B] px-2.5 py-1 rounded shadow-xs h-7 shrink-0">
    <span className="text-[#A4C639] font-black text-xs tracking-tight">Pay</span>
    <span className="text-white font-black text-xs tracking-tight">U</span>
  </div>
);

const VisaLogo = () => (
  <div className="flex items-center bg-white border border-neutral-200 rounded px-1.5 py-0.5 shadow-2xs h-6 shrink-0">
    <span className="text-[#1A1F71] font-black italic text-[11px] tracking-tighter">VISA</span>
  </div>
);

const MastercardLogo = () => (
  <div className="flex items-center bg-white border border-neutral-200 rounded px-1.5 py-0.5 shadow-2xs h-6 shrink-0">
    <div className="w-3 h-3 rounded-full bg-[#EB001B] opacity-95 -mr-1" />
    <div className="w-3 h-3 rounded-full bg-[#F79E1B] opacity-95" />
  </div>
);

const RuPayLogo = () => (
  <div className="flex items-center bg-white border border-neutral-200 rounded px-1.5 py-0.5 shadow-2xs h-6 shrink-0">
    <span className="text-[#097939] font-black text-[10px] tracking-tight">Ru<span className="text-[#ED752E]">Pay</span></span>
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
          <GooglePayLogo />
          <PhonePeLogo />
          <PaytmLogo />
          <VisaLogo />
          <MastercardLogo />
          <RuPayLogo />
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
