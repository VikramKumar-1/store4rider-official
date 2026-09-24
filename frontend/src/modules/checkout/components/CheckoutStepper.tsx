import React from "react";
import { UserIcon, TruckIcon, CreditCardIcon, CheckIcon } from "@heroicons/react/24/outline";

interface CheckoutStepperProps {
  currentStep: number;
  validateStep1: () => boolean;
  validateStep2: () => boolean;
  setCurrentStep: (step: 1 | 2 | 3) => void;
}

export const CheckoutStepper = ({ 
  currentStep, 
  validateStep1, 
  validateStep2, 
  setCurrentStep 
}: CheckoutStepperProps) => {
  return (
    <div className="flex items-center gap-2 sm:gap-6 mb-8 pb-4 max-w-2xl">
      {/* Step 1: Personal Info */}
      <button 
        type="button"
        onClick={() => setCurrentStep(1)}
        className="flex items-center gap-2 text-left group"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
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
            Personal Info
          </span>
        </div>
      </button>

      <div className="w-6 sm:w-12 h-[1.5px] bg-neutral-200 shrink-0" />

      {/* Step 2: Shipping & Address */}
      <button 
        type="button"
        onClick={() => {
          if (validateStep1()) setCurrentStep(2);
        }}
        className="flex items-center gap-2 text-left group"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 2 
            ? "bg-[#78350F] text-white shadow-sm" 
            : currentStep > 2 
            ? "bg-emerald-600 text-white" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          {currentStep > 2 ? <CheckIcon className="w-4 h-4 stroke-[3]" /> : <TruckIcon className="w-4 h-4 stroke-[2]" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase">Step 2</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            currentStep === 2 ? "text-[#78350F]" : currentStep > 2 ? "text-neutral-800" : "text-neutral-400"
          }`}>
            Shipping & Address
          </span>
        </div>
      </button>

      <div className="w-6 sm:w-12 h-[1.5px] bg-neutral-200 shrink-0" />

      {/* Step 3: Payment */}
      <button 
        type="button"
        onClick={() => {
          if (validateStep1() && validateStep2()) setCurrentStep(3);
        }}
        className="flex items-center gap-2 text-left group"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
          currentStep === 3 
            ? "bg-[#78350F] text-white shadow-sm" 
            : "bg-neutral-100 text-neutral-400"
        }`}>
          <CreditCardIcon className="w-4 h-4 stroke-[2]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-neutral-400 font-semibold uppercase">Step 3</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${
            currentStep === 3 ? "text-[#78350F]" : "text-neutral-400"
          }`}>
            Payment
          </span>
        </div>
      </button>
    </div>
  );
};
