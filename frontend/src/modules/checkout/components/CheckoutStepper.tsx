import React from "react";
import { UserIcon, TruckIcon, CreditCardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CheckoutStepperProps {
  currentStep: number;
  validateStep1?: () => boolean;
  validateStep2?: () => boolean;
  setCurrentStep?: (step: 1 | 2) => void;
}

export const CheckoutStepper = ({ 
  currentStep
}: CheckoutStepperProps) => {
  return (
    <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-6 mb-3 sm:mb-5 pb-1 sm:pb-2 max-w-2xl w-full">
      {/* Step 1: Shipping & Details */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 text-left cursor-default select-none shrink-0">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 1 
            ? "bg-banner text-white shadow-sm ring-2 ring-banner/20" 
            : currentStep > 1 
            ? "bg-emerald-600 text-white" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          {currentStep > 1 ? <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : <TruckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] sm:text-[10px] text-neutral-400 font-semibold uppercase">Step 1</span>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider whitespace-nowrap ${
            currentStep === 1 ? "text-banner" : currentStep > 1 ? "text-neutral-800" : "text-neutral-400"
          }`}>
            Shipping & Details
          </span>
        </div>
      </div>

      <div className="w-4 sm:w-16 h-[1.5px] bg-neutral-200 shrink-0 flex-1 sm:flex-none" />

      {/* Step 2: Payment */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 text-left cursor-default select-none shrink-0">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 2 
            ? "bg-banner text-white shadow-sm ring-2 ring-banner/20" 
            : currentStep > 2 
            ? "bg-emerald-600 text-white" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          {currentStep > 2 ? <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : <CreditCardIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] sm:text-[10px] text-neutral-400 font-semibold uppercase">Step 2</span>
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider whitespace-nowrap ${
            currentStep === 2 ? "text-banner" : currentStep > 2 ? "text-neutral-800" : "text-neutral-400"
          }`}>
            Payment
          </span>
        </div>
      </div>
    </div>
  );
};
