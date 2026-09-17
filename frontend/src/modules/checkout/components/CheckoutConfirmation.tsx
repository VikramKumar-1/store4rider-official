import React from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

interface CheckoutConfirmationProps {
  generatedOrderNumber: string;
  paymentOption: "razorpay" | "partial_cod";
  setPaymentOption: (option: "razorpay" | "partial_cod") => void;
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
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400 font-semibold uppercase">Order Number</span>
        <span className="font-mono text-base font-bold text-neutral-900">
          {generatedOrderNumber}
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          Payment Information
        </span>
        <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-lg">
          Upon confirming your order here, you will receive a payment confirmation result. This result will contain essential information about the items you have purchased and the total amount that needs to be paid.
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <label
          onClick={() => setPaymentOption("razorpay")}
          className={`flex items-center justify-between p-4 border rounded-none cursor-pointer transition-all ${
            paymentOption === "razorpay"
              ? "border-banner bg-orange-50/20 ring-1 ring-banner"
              : "border-neutral-300 hover:border-neutral-400"
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="paymentOption"
              checked={paymentOption === "razorpay"}
              onChange={() => setPaymentOption("razorpay")}
              className="accent-orange-600 w-4 h-4"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-neutral-900">
                Online Payment (UPI, Cards, NetBanking, EMI)
              </span>
              <span className="text-[11px] text-neutral-500">
                Google Pay, PhonePe, Paytm, Visa, Mastercard
              </span>
            </div>
          </div>
          <ShieldCheckIcon className="w-5 h-5 text-green-600" />
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="text-xs uppercase font-bold text-neutral-500 hover:text-neutral-900 px-2 py-3"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleAgreeToPay}
          disabled={isProcessing}
          className="bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase px-12 py-4 rounded-none shadow-md transition-all ml-auto disabled:opacity-50 active:scale-[0.99]"
        >
          {isProcessing ? "PROCESSING..." : "I AGREE TO PAY"}
        </button>
      </div>
    </div>
  );
};
