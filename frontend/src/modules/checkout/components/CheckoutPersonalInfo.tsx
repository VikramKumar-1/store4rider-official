import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface CheckoutPersonalInfoProps {
  formData: {
    name: string;
    countryCode: string;
    phone: string;
    altPhone: string;
    email: string;
    [key: string]: any;
  };
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleContinueToShipping: (e: React.FormEvent) => void;
}

export const CheckoutPersonalInfo = ({ 
  formData, 
  handleInputChange, 
  handleContinueToShipping 
}: CheckoutPersonalInfoProps) => {
  return (
    <form onSubmit={handleContinueToShipping} className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Contact Person Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
          CONTACT PERSON
        </h2>
        <p className="text-xs text-neutral-500">
          Enter your contact details so we can send you order confirmation and updates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            NAME *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Eg: Vikram Kumar"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Phone Number with Flag selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            PHONE NUMBER *
          </label>
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleInputChange}
                className="appearance-none bg-white border border-neutral-300 rounded-none pl-3 pr-8 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#78350F]"
              >
                <option value="+91">🇮🇳 (+91)</option>
                <option value="+1">🇺🇸 (+1)</option>
                <option value="+44">🇬🇧 (+44)</option>
                <option value="+971">🇦🇪 (+971)</option>
              </select>
              <ChevronDownIcon className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="9876543210"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Alternate Phone Number */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="altPhone" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            ALTERNATE PHONE NUMBER
          </label>
          <input
            id="altPhone"
            name="altPhone"
            type="tel"
            placeholder="Optional"
            value={formData.altPhone}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Email Address */}
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            EMAIL ADDRESS *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vikram@example.com"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Button at the bottom of the form */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full sm:w-auto min-w-[240px] bg-brand hover:bg-red-800 text-white font-bold tracking-widest text-xs uppercase py-4 px-8 rounded-none shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          CONTINUE TO SHIPPING & ADDRESS
          <span className="text-base leading-none">→</span>
        </button>
      </div>

    </form>
  );
};
