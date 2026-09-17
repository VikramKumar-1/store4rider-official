import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi NCR", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", 
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

interface CheckoutPersonalInfoProps {
  formData: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleContinueToShipping: (e: React.FormEvent) => void;
}

export const CheckoutPersonalInfo = ({ formData, handleInputChange, handleContinueToShipping }: CheckoutPersonalInfoProps) => {
  return (
    <form onSubmit={handleContinueToShipping} className="flex flex-col gap-8 animate-in fade-in duration-300">
      
      {/* Section 1: Contact Person */}
      <div className="flex flex-col gap-4">
        <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
          CONTACT PERSON
        </h2>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            NAME
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Eg: John Doe"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Phone Number with Flag selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            PHONE NUMBER
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
              placeholder="111-2222-33333"
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
            placeholder="111-2222-33333"
            value={formData.altPhone}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Email Address */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            EMAIL ADDRESS
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="johndoe@gmail.com"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="w-full h-px bg-neutral-200 my-2" />

      {/* Section 2: Address Detail */}
      <div className="flex flex-col gap-4">
        <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
          ADDRESS DETAIL
        </h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            DETAILED ADDRESS
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            placeholder="Block / Unit / Street"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="state" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            STATE
          </label>
          <div className="relative">
            <select
              id="state"
              name="state"
              required
              value={formData.state}
              onChange={handleInputChange}
              className="appearance-none w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 bg-white focus:outline-none transition-colors"
            >
              <option value="" disabled>Select State</option>
              {INDIAN_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            CITY
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            placeholder="E.g. Mumbai"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pinCode" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            ZIP CODE
          </label>
          <input
            id="pinCode"
            name="pinCode"
            type="text"
            required
            placeholder="E.g. 400001"
            value={formData.pinCode}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          className="w-full bg-[#78350F] text-white py-3.5 text-sm font-bold uppercase tracking-widest hover:bg-[#92400E] transition-colors"
        >
          CONTINUE TO SHIPPING DELIVERY
        </button>
      </div>
    </form>
  );
};
