import React from "react";
import { TruckIcon, CreditCardIcon, CheckIcon } from "@heroicons/react/24/outline";

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
    <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 sm:px-5 sm:py-3.5 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.04),inset_0_1.5px_0_rgba(255,255,255,1),inset_0_-1px_2px_rgba(0,0,0,0.02)] border border-slate-100/90 ring-1 ring-slate-900/[0.03] mb-5 w-full flex items-center justify-between sm:justify-start gap-2 sm:gap-6">
      {/* Step 1: Shipping & Details */}
      <div className="flex items-center gap-2 sm:gap-3 text-left cursor-default select-none shrink-0">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
          currentStep === 1 
            ? "bg-gradient-to-br from-banner to-[#ea4719] text-white shadow-[0_6px_16px_rgba(255,84,41,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] ring-4 ring-orange-100/70" 
            : currentStep > 1 
            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_6px_16px_rgba(16,185,129,0.3),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)]" 
            : "bg-slate-100 text-slate-400 shadow-[inset_0_2px_4px_rgba(15,23,42,0.05)]"
        }`}>
          {currentStep > 1 ? (
            <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          ) : (
            <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Step 1</span>
          <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wide whitespace-nowrap transition-colors ${
            currentStep === 1 ? "text-banner" : currentStep > 1 ? "text-slate-900" : "text-slate-400"
          }`}>
            Shipping & Details
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="h-1.5 rounded-full bg-slate-200/70 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] shrink-0 flex-1 sm:w-20 overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            currentStep > 1 ? "w-full bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-[0_1px_4px_rgba(16,185,129,0.4)]" : "w-1/2 bg-gradient-to-r from-banner to-orange-400"
          }`} 
        />
      </div>

      {/* Step 2: Payment */}
      <div className="flex items-center gap-2 sm:gap-3 text-left cursor-default select-none shrink-0">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
          currentStep === 2 
            ? "bg-gradient-to-br from-banner to-[#ea4719] text-white shadow-[0_6px_16px_rgba(255,84,41,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)] ring-4 ring-orange-100/70" 
            : currentStep > 2 
            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_6px_16px_rgba(16,185,129,0.3),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.15)]" 
            : "bg-slate-100 text-slate-400 shadow-[inset_0_2px_4px_rgba(15,23,42,0.05)]"
        }`}>
          {currentStep > 2 ? (
            <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          ) : (
            <CreditCardIcon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Step 2</span>
          <span className={`text-[11px] sm:text-xs font-black uppercase tracking-wide whitespace-nowrap transition-colors ${
            currentStep === 2 ? "text-banner" : currentStep > 2 ? "text-slate-900" : "text-slate-400"
          }`}>
            Payment
          </span>
        </div>
      </div>
    </div>
  );
};
