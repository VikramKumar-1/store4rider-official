import React from "react";
import { UserIcon, TruckIcon, CreditCardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CheckoutStepperProps {
  currentStep: number;
  validateStep1: () => boolean;
  setCurrentStep: (step: 1 | 2 | 3) => void;
}

export const CheckoutStepper = ({ currentStep, validateStep1, setCurrentStep }: CheckoutStepperProps) => {
  return (
    <div className="flex items-center gap-3 sm:gap-8 mb-8 pb-4 max-w-xl">
      {/* Step 1: Personal Info */}
      <button 
        onClick={() => setCurrentStep(1)}
        className="flex items-center gap-2.5 text-left group"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          currentStep === 1 
            ? "bg-[#78350F] text-white shadow-sm" 
            : currentStep > 1 
            ? "bg-emerald-600 text-white" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          {currentStep > 1 ? <CheckIcon className="w-4 h-4 stroke-[3]" /> : <UserIcon className="w-4 h-4 stroke-[2]" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase">Step 1</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            currentStep === 1 ? "text-[#78350F]" : currentStep > 1 ? "text-neutral-800" : "text-neutral-400"
          }`}>
            PERSONAL INFO
          </span>
        </div>
      </button>

      <div className="w-8 sm:w-16 h-[1.5px] bg-neutral-200 shrink-0" />

      {/* Step 2/3: Shipping Delivery / Confirmation */}
      {currentStep < 3 ? (
        <button 
          onClick={() => validateStep1() && setCurrentStep(2)}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            currentStep === 2 
              ? "bg-[#78350F] text-white shadow-sm" 
              : "bg-neutral-100 text-neutral-400"
          }`}>
            <TruckIcon className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase">Step 2</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              currentStep === 2 ? "text-[#78350F]" : "text-neutral-400"
            }`}>
              SHIPPING DELIVERY
            </span>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-full bg-[#78350F] text-white flex items-center justify-center shadow-sm">
            <CreditCardIcon className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 font-semibold uppercase">Step 2</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#78350F]">
              CONFIRMATION
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
