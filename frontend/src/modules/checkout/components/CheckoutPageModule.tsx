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
import { CheckoutPersonalInfo } from "./CheckoutPersonalInfo";
import { CheckoutStepper } from "./CheckoutStepper";
import { CheckoutShippingDelivery } from "./CheckoutShippingDelivery";
import { CheckoutConfirmation } from "./CheckoutConfirmation";
import { useCheckout } from "@/core/hooks/useCheckout";
import { usePublicSettings } from "@/core/hooks/usePaymentSettings";
import { PaymentMethodType } from "@store4riders/shared-types";
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

declare global {
  interface Window {}
}

export const CheckoutPageModule = () => {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const { mutate: placeOrder, isPending: isPlacingOrder } = useCheckout();
  const { data: settings } = usePublicSettings();
  
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
  const [paymentOption, setPaymentOption] = useState<PaymentMethodType>("payu");
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedOrderNumber, setGeneratedOrderNumber] = useState("12345678910");

  useEffect(() => {
    setMounted(true);
    setGeneratedOrderNumber(`ORD-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
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

  const shippingCost = settings ? (subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost) : 0;
  const voucherDiscount = subtotal >= 3000 ? 500 : 0; // Voucher 50KDISCOUNT
  const total = Math.max(0, subtotal - voucherDiscount + shippingCost);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errorMessage) setErrorMessage("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setErrorMessage("Please provide your name, phone number, and email address.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const validateStep2 = () => {
    if (!formData.address.trim() || !formData.state || !formData.pinCode.trim()) {
      setErrorMessage("Please complete all shipping address fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleContinueToShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleContinueToPayment = () => {
    if (validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAgreeToPay = () => {
    setIsProcessing(true);
    // Address saving/fetching will be handled in later phases, for now we mock
    placeOrder({ 
      shippingAddressId: "temp-addr-id", 
      paymentMethod: paymentOption
    }, {
      onSettled: () => setIsProcessing(false),
      onSuccess: () => {
        // Success logic is handled by the hook (redirection)
      }
    });
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
      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-24 md:pt-4 md:pb-32 flex-1">
        
        {/* ========================================================================= */}
        {/* SCREEN 4: SUCCESS (matching Figma Screen 4) */}
        {/* ========================================================================= */}
        {currentStep === 4 ? (
          <div className="max-w-2xl mx-auto py-16 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-400">
            {/* Green Checkmark Circle */}
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-md">
              <CheckIcon className="w-9 h-9 stroke-[3]" />
            </div>

            {/* Modern Heading: PAYMENT SUCCESS! */}
            <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-wide uppercase mb-4">
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
            {/* Two Column Layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              
              {/* Left Column: Form Steps */}
              <div className="w-full lg:w-[62%]">
                
                {/* Stepper Progress Bar - Moved inside left column to save vertical space */}
                <CheckoutStepper 
                  currentStep={currentStep} 
                  setCurrentStep={setCurrentStep as (step: 1 | 2 | 3) => void} 
                  validateStep1={validateStep1} 
                  validateStep2={validateStep2}
                />
                
                {/* ------------------------------------------------------------- */}
                {/* STEP 1: PERSONAL INFO (Contact Person) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 1 && (
                  <CheckoutPersonalInfo 
                    formData={formData}
                    handleInputChange={handleInputChange}
                    handleContinueToShipping={handleContinueToShipping}
                  />
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 2: SHIPPING & ADDRESS (Address Detail + Delivery Method) */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 2 && (
                  <CheckoutShippingDelivery
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setErrorMessage={setErrorMessage}
                    errorMessage={errorMessage}
                    setCurrentStep={setCurrentStep as (step: 1 | 2 | 3) => void}
                    handleContinueToPayment={handleContinueToPayment}
                    shippingCost={shippingCost}
                    freeShippingThreshold={settings?.freeShippingThreshold || 999}
                  />
                )}

                {/* ------------------------------------------------------------- */}
                {/* STEP 3: PAYMENT METHOD */}
                {/* ------------------------------------------------------------- */}
                {currentStep === 3 && (
                  <CheckoutConfirmation
                    generatedOrderNumber={generatedOrderNumber}
                    paymentOption={paymentOption}
                    setPaymentOption={setPaymentOption}
                    setCurrentStep={setCurrentStep as (step: 1 | 2 | 3) => void}
                    handleAgreeToPay={handleAgreeToPay}
                    isProcessing={isProcessing}
                  />
                )}

              </div>

              {/* Right Column: ORDER SUMMARY (Sticky on desktop) */}
              <div className="w-full lg:w-[38%] lg:sticky lg:top-4 z-20">
                <div className="flex flex-col bg-white border border-neutral-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-5 sm:p-6">
                  
                  {/* Validation Error Alert Banner */}
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between mb-4">
                      <span>{errorMessage}</span>
                      <button
                        onClick={() => setErrorMessage("")}
                        className="text-red-400 hover:text-red-600 p-0.5 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  )}

                  {/* Promo Applied Banner in Order Summary */}
                  {voucherDiscount > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-[11px] font-bold flex items-center justify-between mb-4">
                      <span className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4" />
                        Voucher "50KDISCOUNT" Applied!
                      </span>
                      <button className="text-emerald-500 hover:text-emerald-700">
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Heading */}
                  <h2 className="font-sans font-bold text-lg text-neutral-900 tracking-tight mb-4">
                    Order Summary
                  </h2>

                  {/* Items Mini List */}
                  <div className="flex flex-col gap-3 mb-5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                    {items.map((item) => {
                      const product = item.product || {};
                      const name = product.name || "Riding Gear";
                      const price = product.basePrice || (item as any).price || 0;
                      const rawImg = product.images?.[0]?.url || product.image || FALLBACK_IMAGE;

                      return (
                        <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 group">
                          <div className="relative w-12 h-12 bg-neutral-50 rounded-lg overflow-hidden shrink-0 border border-neutral-100 group-hover:border-neutral-200 transition-colors">
                            <Image
                              src={rawImg}
                              alt={name}
                              fill
                              className="object-contain p-1"
                              sizes="48px"
                            />
                          </div>

                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-[11px] text-neutral-900 uppercase line-clamp-1 leading-tight">
                              {name}
                            </span>
                            <span className="text-[11px] text-neutral-500 font-medium mt-0.5">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          
                          <div className="text-[13px] font-bold text-neutral-900">
                            {formatPrice(price * item.quantity)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-dashed border-neutral-200">
                    <div className="flex items-center justify-between text-sm text-neutral-500 font-medium">
                      <span>Subtotal</span>
                      <span className="text-neutral-900">{formatPrice(subtotal)}</span>
                    </div>

                    {voucherDiscount > 0 && (
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="text-emerald-600">Discount</span>
                        <span className="text-emerald-600 font-bold">-{formatPrice(voucherDiscount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm font-medium text-neutral-500">
                      <span>Shipping</span>
                      <span className={shippingCost === 0 ? 'text-emerald-600 font-bold' : 'text-neutral-900'}>
                        {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-200">
                    <span className="text-base font-bold text-neutral-900">Total</span>
                    <span className="text-2xl font-black text-[#AB1509] tracking-tight">
                      {formatPrice(total)}
                    </span>
                  </div>

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-3 mt-6 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><ShieldCheckIcon className="w-3.5 h-3.5"/> Secure</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><LockClosedIcon className="w-3.5 h-3.5"/> Encrypted</span>
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
