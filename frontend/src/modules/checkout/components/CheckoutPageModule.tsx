"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { formatPrice } from "@store4riders/shared-utils";
import TopBanner from "@/modules/homepage/components/TopBanner";
import Navbar from "@/modules/homepage/components/Navbar";
import Footer from "@/modules/homepage/components/Footer";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { 
  UserIcon, 
  TruckIcon, 
  CreditCardIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  ShieldCheckIcon,
  LockClosedIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80";

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi NCR", "Goa", 
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", 
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

interface CourierOption {
  id: string;
  name: string;
  logoText: string;
  badgeBg?: string;
  badgeText?: string;
  cost: number;
}

const COURIER_OPTIONS: CourierOption[] = [
  {
    id: "delhivery",
    name: "JNE / Delhivery Surface",
    logoText: "DELHIVERY",
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    cost: 49,
  },
  {
    id: "bluedart",
    name: "TIKI / BlueDart Express Air",
    logoText: "BLUEDART",
    badgeBg: "bg-blue-700",
    badgeText: "text-white",
    cost: 149,
  },
  {
    id: "dhl",
    name: "DHL Express Delivery",
    logoText: "DHL",
    badgeBg: "bg-yellow-400",
    badgeText: "text-red-700",
    cost: 299,
  },
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPageModule = () => {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  // 4 Figma Steps: 1: Checkout Form, 2: Shipping, 3: Confirmation, 4: Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Validation error alert
  const [errorMessage, setErrorMessage] = useState("");
  
  // Form State matching Figma Screen 1
  const [formData, setFormData] = useState({
    name: "",
    countryCode: "+91",
    phone: "",
    altPhone: "",
    email: "",
    address: "",
    state: "",
    city: "",
    pinCode: "",
  });

  // Shipping & Payment Options
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(COURIER_OPTIONS[0]);
  const [paymentOption, setPaymentOption] = useState<"razorpay" | "partial_cod">("razorpay");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState("12345678910");

  useEffect(() => {
    setMounted(true);
    setGeneratedOrderNumber(`ORD-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  }, []);

  // Load Razorpay Checkout Script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Redirect to cart if empty and not on success step
  useEffect(() => {
    if (mounted && items.length === 0 && currentStep !== 4) {
      router.push("/cart");
    }
  }, [mounted, items.length, currentStep, router]);

  if (!mounted) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col font-sans">
        <TopBanner message="Discount 20% For New Member," highlightText="ONLY FOR TODAY!!" />
        <div className="bg-white border-b border-neutral-200">
          <Navbar logoText="Store4Riders" theme="light" navItems={[]} />
        </div>
        <div className="max-w-[1400px] w-full mx-auto px-4 py-16 animate-pulse">
          <div className="h-12 w-64 bg-neutral-100 rounded mb-8" />
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((total, item) => {
    const itemPrice = item.product?.basePrice || (item as any).price || 0;
    return total + itemPrice * item.quantity;
  }, 0);

  const shippingCost = selectedCourier ? selectedCourier.cost : 0;
  const voucherDiscount = subtotal >= 3000 ? 500 : 0; // Voucher 50KDISCOUNT
  const total = Math.max(0, subtotal - voucherDiscount + shippingCost);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.address.trim() || !formData.state || !formData.pinCode.trim()) {
      setErrorMessage("Please complete all the input fields.");
      window.scrollTo({ top: 120, behavior: "smooth" });
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleContinueToShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleContinueToConfirmation = () => {
    if (!selectedCourier) {
      setErrorMessage("Oops! Please choose shipping method.");
      window.scrollTo({ top: 120, behavior: "smooth" });
      return;
    }
    setErrorMessage("");
    setCurrentStep(3);
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleAgreeToPay = async () => {
    if (!window.Razorpay) {
      toast.error("Payment SDK is loading, please try again in a moment.");
      return;
    }

    setIsProcessing(true);

    try {
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_SxxPIU94rZKzyE";

      const options = {
        key: razorpayKey,
        amount: total * 100, // in paise
        currency: "INR",
        name: "Store4Riders",
        description: `Order ${generatedOrderNumber}`,
        order_id: "",
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: `${formData.countryCode}${formData.phone}`,
        },
        theme: {
          color: "#EA580C", // Bright orange
        },
        handler: function (response: any) {
          setIsProcessing(false);
          clearCart();
          setCurrentStep(4); // Move to Screen 4: Success
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setIsProcessing(false);
        toast.error(`Payment Failed: ${response.error?.description || "Transaction cancelled"}`);
      });
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      toast.error("Failed to initiate payment. Please try again.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col font-sans relative">
      
      {/* Top Banner */}
      <TopBanner
        message="Discount 20% For New Member,"
        highlightText="ONLY FOR TODAY!!"
      />

      {/* Navbar with Brand Logo */}
      <div className="bg-white border-b border-neutral-200 relative z-40">
        <Navbar
          logoText="Store4Riders"
          theme="light"
          navItems={[
            { id: "catalog", label: "Catalog", href: "/products", hasDropdown: true },
            { id: "sale", label: "Sale", href: "/sale" },
            { id: "new-arrival", label: "New Arrival", href: "/products?sort=newest" },
            { id: "about", label: "About", href: "/about" },
          ]}
        />
      </div>

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: "HOME", href: "/" },
        { label: "CART", href: "/cart" },
        { label: "CHECKOUT" }
      ]} />

      {/* Main Content */}
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex-1">
        
        {/* ========================================================================= */}
        {/* SCREEN 4: SUCCESS (matching Figma Screen 4) */}
        {/* ========================================================================= */}
        {currentStep === 4 ? (
          <div className="max-w-2xl mx-auto py-16 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-400">
            {/* Green Checkmark Circle */}
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-md">
              <CheckIcon className="w-9 h-9 stroke-[3]" />
            </div>

            {/* Grand Serif Heading: PAYMENT SUCCESS! */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-neutral-900 tracking-tight uppercase mb-4">
              PAYMENT SUCCESS!
            </h1>

            <p className="text-neutral-500 text-xs sm:text-sm max-w-lg mb-8 leading-relaxed font-sans">
              Thank you for shopping with Store4Riders. Your order <strong>#{generatedOrderNumber}</strong> has been confirmed. A receipt and tracking details have been sent to <strong>{formData.email}</strong>.
            </p>

            <Link
              href="/"
              className="bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase px-12 py-4 rounded-none shadow-md transition-all active:scale-[0.99]"
            >
              BACK TO HOME
            </Link>
          </div>
        ) : (
          /* ========================================================================= */
          /* SCREENS 1, 2, 3: CHECKOUT FLOW */
          /* ========================================================================= */
          <>
            {/* Stepper Progress Bar */}
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

            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
              
              {/* Left Column: Form Steps */}
              <div className="w-full lg:w-[62%]">
                
                {/* ------------------------------------------------------------- */}
                {/* SCREEN 1: CHECKOUT FORM (Contact Person + Address Detail) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
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

                      {/* Alternate Phone Number matching Screen 1 */}
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

                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                          EMAIL
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="Eg: example@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Section 2: Address Detail */}
                    <div className="flex flex-col gap-4 pt-4 border-t border-neutral-100">
                      <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
                        ADDRESS DETAIL
                      </h2>

                      {/* Address */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                          ADDRESS
                        </label>
                        <input
                          id="address"
                          name="address"
                          type="text"
                          required
                          placeholder="Eg: ABC Street 12A, West Java, Indonesia"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
                        />
                      </div>

                      {/* State */}
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
                            className="w-full appearance-none bg-white border border-neutral-300 rounded-none px-4 py-3 text-sm text-neutral-800 focus:outline-none focus:border-[#78350F]"
                          >
                            <option value="">--Choose State--</option>
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                          <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* City & Pin Code Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="city" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                            CITY
                          </label>
                          <input
                            id="city"
                            name="city"
                            type="text"
                            placeholder="--Choose City--"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="pinCode" className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                            PIN CODE
                          </label>
                          <input
                            id="pinCode"
                            name="pinCode"
                            type="text"
                            required
                            placeholder="--Choose PIN Code--"
                            value={formData.pinCode}
                            onChange={handleInputChange}
                            className="w-full border border-neutral-300 focus:border-[#78350F] rounded-none px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Section 3: Terms & Conditions Accordion matching Screen 1 */}
                    <div className="border border-neutral-200 rounded-none p-4 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsTermsOpen(!isTermsOpen)}
                        className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800"
                      >
                        <span>TERMS AND CONDITIONS ACCORDION</span>
                        {isTermsOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </button>
                      {isTermsOpen && (
                        <div className="mt-3 text-xs text-neutral-500 leading-relaxed border-t border-neutral-100 pt-3">
                          By placing this order, you agree to our 100% genuine motorcycle gear guarantee, standard dispatch policy within 24-48 business hours, and 7-day hassle-free return/exchange terms.
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="bg-banner hover:bg-orange-600 text-white font-bold tracking-widest text-xs uppercase px-10 py-4 rounded-none shadow-md transition-all active:scale-[0.99]"
                      >
                        CONTINUE TO SHIPPING
                      </button>
                    </div>

                  </form>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SCREEN 2: CHECKOUT/SHIPPING (Shipping Delivery) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                  <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                    <h2 className="font-sans font-bold text-lg md:text-xl text-neutral-900 tracking-tight uppercase">
                      SHIPPING DELIVERY
                    </h2>

                    <div className="flex flex-col gap-4">
                      {COURIER_OPTIONS.map((courier) => {
                        const isSelected = selectedCourier?.id === courier.id;

                        return (
                          <div
                            key={courier.id}
                            onClick={() => {
                              setSelectedCourier(courier);
                              if (errorMessage) setErrorMessage("");
                            }}
                            className={`border rounded-none p-5 cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#78350F] bg-amber-50/20 ring-1 ring-[#78350F]"
                                : "border-neutral-300 hover:border-neutral-400 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "border-[#78350F]" : "border-neutral-300"
                              }`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#78350F]" />}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 text-[11px] font-black tracking-wider rounded-xs uppercase ${courier.badgeBg} ${courier.badgeText}`}>
                                  {courier.logoText}
                                </span>
                                <span className="font-sans font-bold text-sm text-neutral-900">
                                  {courier.name}
                                </span>
                              </div>
                            </div>

                            <span className="font-sans font-medium text-sm text-neutral-900">
                              {formatPrice(courier.cost)}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs uppercase font-bold text-neutral-500 hover:text-neutral-900 px-2 py-3"
                      >
                        ← Back to Personal Info
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueToConfirmation}
                        className="bg-[#78350F] hover:bg-[#5E2B0C] text-white font-bold tracking-widest text-xs uppercase px-10 py-4 rounded-none shadow-md transition-all ml-auto"
                      >
                        CONTINUE TO PAYMENT
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SCREEN 3: CHECKOUT/CONFIRMATION (Confirmation & I Agree to Pay) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 3 && (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    
                    {/* Order Number */}
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-neutral-400 font-semibold uppercase">Order Number</span>
                      <span className="font-mono text-base font-bold text-neutral-900">
                        {generatedOrderNumber}
                      </span>
                    </div>

                    {/* Payment Information Disclaimer matching Screen 3 */}
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                        Payment Information
                      </span>
                      <p className="text-xs text-neutral-500 leading-relaxed font-sans max-w-lg">
                        Upon confirming your order here, you will receive a payment confirmation result. This result will contain essential information about the items you have purchased and the total amount that needs to be paid.
                      </p>
                    </div>

                    {/* Payment Method Selector */}
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
                            <span className="text-[11px] text-neutral-500">Google Pay, PhonePe, Paytm, Visa, Mastercard</span>
                          </div>
                        </div>
                        <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                      </label>
                    </div>

                    {/* Big Orange Button matching Screen 3: I AGREE TO PAY */}
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
                )}

              </div>

              {/* Right Column: ORDER SUMMARY matching all Figma screens (Sticky on desktop) */}
              <div className="w-full lg:w-[38%] lg:sticky lg:top-24 bg-white z-20">
                <div className="flex flex-col">
                  
                  {/* Validation Error Alert Banner matching Figma */}
                  {errorMessage && (
                    <div className="bg-[#B91C1C] text-white px-4 py-3 rounded-none text-xs font-semibold flex items-center justify-between shadow-md mb-6 animate-in slide-in-from-top duration-200">
                      <span>{errorMessage}</span>
                      <button
                        onClick={() => setErrorMessage("")}
                        className="text-white/80 hover:text-white p-0.5"
                      >
                        <XMarkIcon className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  )}

                  {/* Promo Applied Banner in Order Summary */}
                  {voucherDiscount > 0 && (
                    <div className="bg-neutral-100 border border-neutral-200 text-neutral-700 px-4 py-2.5 rounded-none text-xs font-medium flex items-center justify-between mb-6">
                      <span>Hooray! You use promo code!</span>
                      <XMarkIcon className="w-3.5 h-3.5 text-neutral-400 cursor-pointer" />
                    </div>
                  )}

                  {/* Heading */}
                  <h2 className="font-sans font-bold text-xl sm:text-2xl text-neutral-900 tracking-tight uppercase mb-6">
                    ORDER SUMMARY
                  </h2>

                  {/* Items Mini List matching Figma */}
                  <div className="flex flex-col divide-y divide-neutral-100 mb-6">
                    {items.map((item) => {
                      const product = item.product || {};
                      const name = product.name || "Riding Gear";
                      const price = product.basePrice || (item as any).price || 0;
                      const rawImg = product.images?.[0]?.url || product.image || FALLBACK_IMAGE;

                      return (
                        <div key={`${item.productId}-${item.variantId}`} className="py-4 first:pt-0 flex items-start gap-4">
                          <div className="relative w-16 h-16 bg-neutral-100 rounded-none overflow-hidden shrink-0 border border-neutral-200">
                            <Image
                              src={rawImg}
                              alt={name}
                              fill
                              className="object-contain p-1"
                              sizes="64px"
                            />
                          </div>

                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-neutral-900 uppercase line-clamp-1">
                              {name}
                            </span>
                            <span className="text-xs text-neutral-500 font-semibold mt-0.5">
                              {item.quantity} X {formatPrice(price)}
                            </span>
                            {product.orderNote && (
                              <span className="text-[10px] text-neutral-400 italic mt-1 line-clamp-1">
                                {product.orderNote}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="flex flex-col gap-3.5 py-4 border-t border-b border-neutral-200">
                    <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-neutral-900">{formatPrice(subtotal)}</span>
                    </div>

                    {voucherDiscount > 0 && (
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-neutral-600">Voucher (50KDISCOUNT)</span>
                        <span className="text-[#DC2626] font-bold">-{formatPrice(voucherDiscount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-neutral-600">
                      <span>Shipping</span>
                      <span className="font-semibold text-neutral-900">
                        {selectedCourier ? formatPrice(selectedCourier.cost) : "IDR -"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-base text-neutral-900 font-bold pt-1">
                      <span>Total</span>
                      <span className="text-xl font-extrabold text-neutral-900">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium uppercase tracking-wider text-center">
                    <span>✓ 256-Bit SSL Encryption</span>
                    <span>•</span>
                    <span>✓ Verified Payment</span>
                  </div>

                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* Global Footer */}
      <Footer />

    </div>
  );
};
