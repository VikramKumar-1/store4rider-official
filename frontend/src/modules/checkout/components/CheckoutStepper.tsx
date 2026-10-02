import React from "react";
import { UserIcon, TruckIcon, CreditCardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CheckoutStepperProps {
  currentStep: number;
  validateStep1?: () => boolean;
  validateStep2?: () => boolean;
  setCurrentStep?: (step: 1 | 2 | 3) => void;
}

export const CheckoutStepper = ({ 
  currentStep
}: CheckoutStepperProps) => {
  return (
    <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-6 mb-4 sm:mb-8 pb-2 sm:pb-4 max-w-2xl w-full">
      {/* Step 1: Personal Info */}
      <div className="flex items-center gap-1 sm:gap-2 text-left cursor-default select-none shrink-0">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 1 
            ? "bg-[#78350F] text-white shadow-sm" 
            : currentStep > 1 
            ? "bg-emerald-600 text-white" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          {currentStep > 1 ? <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" /> : <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2]" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] sm:text-[10px] text-neutral-400 font-semibold uppercase">Step 1</span>
          <span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider whitespace-nowrap ${
            currentStep === 1 ? "text-[#78350F]" : currentStep > 1 ? "text-neutral-800" : "text-neutral-400"
          }`}>
            Personal Info
          </span>
        </div>
      </div>

      <div className="w-2 sm:w-12 h-[1.5px] bg-neutral-200 shrink-0 flex-1 sm:flex-none" />

      {/* Step 2: Shipping & Address */}
      <div className="flex items-center gap-1 sm:gap-2 text-left cursor-default select-none shrink-0">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 2 
            ? "bg-[#78350F] text-white shadow-sm" 
            : currentStep > 2 
            ? "bg-emerald-600 text-white" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          {currentStep > 2 ? <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" /> : <TruckIcon className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2]" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] sm:text-[10px] text-neutral-400 font-semibold uppercase">Step 2</span>
          <span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider whitespace-nowrap ${
            currentStep === 2 ? "text-[#78350F]" : currentStep > 2 ? "text-neutral-800" : "text-neutral-400"
          }`}>
            <span className="sm:hidden">Shipping</span>
            <span className="hidden sm:inline">Shipping & Address</span>
          </span>
        </div>
      </div>

      <div className="w-2 sm:w-12 h-[1.5px] bg-neutral-200 shrink-0 flex-1 sm:flex-none" />

      {/* Step 3: Payment */}
      <div className="flex items-center gap-1 sm:gap-2 text-left cursor-default select-none shrink-0">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 3 
            ? "bg-[#78350F] text-white shadow-sm" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          <CreditCardIcon className="w-3 h-3 sm:w-4 sm:h-4 stroke-[2]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] sm:text-[10px] text-neutral-400 font-semibold uppercase">Step 3</span>
          <span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wide sm:tracking-wider whitespace-nowrap ${
            currentStep === 3 ? "text-[#78350F]" : "text-neutral-400"
          }`}>
            Payment
          </span>
        </div>
      </div>
    </div>
  );
};
