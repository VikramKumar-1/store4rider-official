import React from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DialCodeSelect } from "./DialCodeSelect";
import { COUNTRIES } from "@/core/utils/countries";

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
  errorMessage?: string;
  setErrorMessage?: (msg: string) => void;
}

export const CheckoutPersonalInfo = ({ 
  formData, 
  handleInputChange, 
  handleContinueToShipping,
  errorMessage,
  setErrorMessage
}: CheckoutPersonalInfoProps) => {
  const currentCountry = COUNTRIES.find((c) => c.code === formData.countryCode);
  const maxPhoneLength = currentCountry?.phoneLength ? Math.max(...currentCountry.phoneLength) : 15;

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
            maxLength={50}
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors"
          />
        </div>

        {/* Phone Number with Flag selector */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            MOBILE NUMBER *
          </label>
          <div className="flex items-center gap-0">
            <DialCodeSelect
              value={formData.countryCode}
              onChange={(val) => handleInputChange({ target: { name: "countryCode", value: val } } as any)}
            />
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              maxLength={maxPhoneLength}
              placeholder="Enter your mobile number"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors"
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
            maxLength={maxPhoneLength}
            placeholder="Enter alternate number (optional)"
            value={formData.altPhone}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors"
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
            maxLength={100}
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-base md:text-sm text-neutral-900 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Button at the bottom of the form */}
      <div className="pt-4 flex flex-col gap-4">
        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-none text-xs font-semibold flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage && setErrorMessage("")}
              className="text-red-400 hover:text-red-600 p-0.5 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        )}
        <button
          type="submit"
          className="w-full sm:w-auto bg-brand hover:bg-red-800 text-white font-bold tracking-wider text-xs uppercase py-4 px-4 md:px-8 rounded-none shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 self-start"
        >
          <span className="sm:hidden">CONTINUE</span>
          <span className="hidden sm:inline">CONTINUE TO SHIPPING & ADDRESS</span>
          <span className="text-base leading-none">→</span>
        </button>
      </div>

    </form>
  );
};
