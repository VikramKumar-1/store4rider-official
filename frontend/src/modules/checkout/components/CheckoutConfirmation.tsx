import React from "react";
import { ShieldCheckIcon, WalletIcon, CurrencyRupeeIcon, BuildingLibraryIcon, BanknotesIcon, HandRaisedIcon } from "@heroicons/react/24/outline";
import { PaymentMethodType } from "@store4riders/shared-types";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";

interface CheckoutConfirmationProps {
  generatedOrderNumber: string;
  paymentOption: PaymentMethodType;
  setPaymentOption: (option: PaymentMethodType) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  handleAgreeToPay: () => void;
  isProcessing: boolean;
}

export const CheckoutConfirmation = ({
  generatedOrderNumber,
  paymentOption,
  setPaymentOption,
  setCurrentStep,
  handleAgreeToPay,
  isProcessing,
}: CheckoutConfirmationProps) => {
  const { data: settings, isLoading } = usePublicSettings();

  const GATEWAY_INFO: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
    upi: {
      label: "UPI (Google Pay, PhonePe, Paytm)",
      desc: "Scan QR or enter UPI ID to pay instantly",
      icon: (
        <div className="flex items-center bg-white px-2 py-1 border border-neutral-200 rounded shadow-sm">
          <span className="text-[#ea6c00] font-black text-sm italic tracking-tighter">UPI</span>
          <span className="text-[#0fa457] font-black text-sm italic tracking-tighter ml-0.5">»</span>
        </div>
      )
    },
    payu: {
      label: "PayU (Cards, International)",
      desc: "Supports international and domestic cards",
      icon: (
        <div className="flex items-center bg-white px-2 py-1 border border-neutral-200 rounded shadow-sm">
          <span className="text-[#99cc33] font-black text-sm tracking-tight">Pay</span>
          <span className="text-[#333333] font-black text-sm tracking-tight">U</span>
        </div>
      )
    },
    ccavenue: {
      label: "CCAvenue (NetBanking, EMI)",
      desc: "Wide range of NetBanking & EMI options",
      icon: (
        <div className="flex items-center bg-white px-2 py-1 border border-neutral-200 rounded shadow-sm">
          <span className="text-[#b81c23] font-black text-[13px] italic tracking-tighter">CCAvenue</span>
        </div>
      )
    },
    snapmint: {
      label: "Snapmint (EMI / Buy Now Pay Later)",
      desc: "Cardless EMI options",
      icon: (
        <div className="flex items-center bg-white px-2 py-1 border border-neutral-200 rounded shadow-sm">
          <span className="text-[#00c99a] font-black text-sm lowercase tracking-tighter">snapmint</span>
        </div>
      )
    },
    cod: {
      label: "Cash on Delivery (COD)",
      desc: "Pay when you receive the order",
      icon: (
        <div className="flex items-center gap-1 bg-neutral-100 px-2 py-1 border border-neutral-200 rounded shadow-sm">
          <BanknotesIcon className="w-4 h-4 text-neutral-800" />
          <span className="text-neutral-800 font-black text-[11px] uppercase tracking-wider">COD</span>
        </div>
      )
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
          PAYMENT METHOD
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-lg">
          Please select your preferred payment method below. All online transactions are secure and encrypted.
        </p>
      </div>

      {/* Gateway Options */}
      <div className="flex flex-col gap-3 pt-1">
        {isLoading ? (
          <div className="p-4 border border-neutral-200 animate-pulse bg-neutral-50 h-24" />
        ) : (
          (settings?.enabledGateways || ["payu", "ccavenue", "snapmint", "cod"]).map((method) => {
            const info = GATEWAY_INFO[method];
            if (!info) return null;
            
            const isCodWithAdvance = method === "cod" && settings?.codPartialPaymentValue && settings.codPartialPaymentValue > 0;
            const isSelected = paymentOption === method;

            return (
              <label
                key={method}
                onClick={() => setPaymentOption(method as PaymentMethodType)}
                className={`flex items-center justify-between p-4 border rounded-none cursor-pointer transition-all ${
                  isSelected
                    ? "border-banner bg-orange-50/20 ring-1 ring-banner"
                    : "border-neutral-300 hover:border-neutral-400 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentOption"
                    checked={isSelected}
                    onChange={() => setPaymentOption(method as PaymentMethodType)}
                    className="accent-orange-600 w-4 h-4 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-neutral-900">
                      {info.label}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {isCodWithAdvance 
                        ? `${info.desc} (Requires ${settings.codPartialPaymentType === 'fixed' ? '₹' + settings.codPartialPaymentValue : settings.codPartialPaymentValue + '%'} advance)` 
                        : info.desc}
                    </span>
                  </div>
                </div>
                {info.icon}
              </label>
            );
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-neutral-200">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="text-xs uppercase font-bold text-neutral-500 hover:text-neutral-900 px-2 py-3 transition-colors"
        >
          ← Back to Shipping
        </button>

        <button
          type="button"
          onClick={handleAgreeToPay}
          disabled={isProcessing || !paymentOption}
          className="bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase px-12 py-4 rounded-none shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? "PROCESSING..." : "PLACE ORDER"}
        </button>
      </div>

    </div>
  );
};
