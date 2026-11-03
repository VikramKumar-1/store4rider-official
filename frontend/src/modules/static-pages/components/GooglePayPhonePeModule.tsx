"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Check, ChevronRight, Download, Smartphone } from "lucide-react";
import { TopBanner } from "@/modules/homepage/components/TopBanner";
import { Navbar } from "@/modules/homepage/components/Navbar";
import { Footer } from "@/modules/homepage/components/Footer";

export const GooglePayPhonePeModule: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const paymentData = {
    phone: "9834999284",
    vpa: "9834999284@okbizaxis",
    accountName: "Motohive Media Pvt. Ltd.",
    accountType: "Current account",
    accountNumber: "916020025974548",
    bank: "Axis Bank - APPA BALWANT CH PUNE MH",
    ifsc: "UTIB0002840",
    upiUri: "upi://pay?pa=9834999284@okbizaxis&pn=Motohive%20Media%20Pvt%20Ltd&cu=INR",
  };

  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-[#fbfbfb] text-neutral-900">
      {/* Header */}
      <header className="w-full">
        <TopBanner />
        <div className="w-full bg-white relative z-40 border-b border-neutral-200 shadow-2xs sticky top-0">
          <Navbar logoText="Store4Riders" theme="light" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-4">
          
          {/* Breadcrumb Header Bar */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto whitespace-nowrap scrollbar-none py-1"
          >
            <Link href="/" className="hover:text-neutral-900 transition-colors font-medium">
              Home
            </Link>
            <ChevronRight size={13} className="text-neutral-400 shrink-0" />
            <span className="text-neutral-900 font-semibold truncate">
              Gpay / Phone Pay
            </span>
          </nav>

          {/* Clean Main Content Card (Standard compact scale, not zoomed) */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-7 shadow-xs space-y-6">
            
            {/* Page Title */}
            <div className="border-b border-neutral-100 pb-3">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Gpay/Phone Pay
              </h1>
            </div>

            {/* UPI & PhonePe Section */}
            <div className="space-y-4">
              
              {/* GooglePay or PhonePay number */}
              <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                    GooglePay or PhonePay number
                  </span>
                  <strong className="text-base sm:text-lg font-bold font-mono text-neutral-900 block truncate">
                    {paymentData.phone}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentData.phone, "phone", "Mobile number")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "phone" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedKey === "phone" ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* UPI ID */}
              <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-lg bg-neutral-50 border border-neutral-200">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                    UPI ID
                  </span>
                  <strong className="text-sm sm:text-base font-bold font-mono text-neutral-900 block truncate">
                    {paymentData.vpa}
                  </strong>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentData.vpa, "vpa", "UPI ID")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === "vpa" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedKey === "vpa" ? "Copied" : "Copy"}</span>
                  </button>
                  <a
                    href={paymentData.upiUri}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white transition-colors"
                  >
                    <Smartphone size={13} />
                    <span>Pay in App</span>
                  </a>
                </div>
              </div>

              {/* Brand Logos */}
              <div className="flex items-center gap-4 sm:gap-6 pt-1">
                <div className="relative h-7 sm:h-8 w-24 sm:w-28">
                  <Image
                    src="/images/payment/GPay.webp"
                    alt="Google Pay"
                    fill
                    sizes="112px"
                    className="object-contain object-left"
                    priority
                    unoptimized
                  />
                </div>
                <div className="h-6 w-px bg-neutral-200" />
                <div className="relative h-8 sm:h-10 w-32 sm:w-40">
                  <Image
                    src="/images/payment/Phonepe.webp"
                    alt="PhonePe"
                    fill
                    sizes="160px"
                    className="object-contain object-left"
                    priority
                    unoptimized
                  />
                </div>
              </div>

              {/* Official Standee QR Image (Centered with crisp high-res rendering) */}
              <div className="pt-2 flex flex-col items-center justify-center space-y-2.5">
                <div className="relative w-[280px] sm:w-[320px] aspect-[1135/1600] rounded-lg overflow-hidden border border-neutral-200 shadow-xs bg-white">
                  <Image
                    src="/images/payment/Store4Riders-UPI-details.webp"
                    alt="Store4Riders UPI QR Code"
                    fill
                    sizes="(max-width: 640px) 280px, 320px"
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <a
                  href="/images/payment/Store4Riders-UPI-details.webp"
                  download="Store4Riders-UPI-details.webp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1.5 underline underline-offset-2 transition-colors"
                >
                  <Download size={13} />
                  <span>Download QR Code Image</span>
                </a>
              </div>

            </div>

            {/* Divider */}
            <hr className="border-neutral-200" />

            {/* Bank Details Section */}
            <div className="space-y-3">
              <h2 className="text-sm sm:text-base font-bold text-neutral-900">
                Our Bank details are as follows:
              </h2>

              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden text-xs sm:text-sm">
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 sm:bg-white gap-2">
                  <span className="font-semibold text-neutral-600 min-w-[120px]">Account Name</span>
                  <span className="font-bold text-neutral-900 text-right">{paymentData.accountName}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white gap-2">
                  <span className="font-semibold text-neutral-600 min-w-[120px]">Type</span>
                  <span className="text-neutral-900 text-right">{paymentData.accountType}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50 sm:bg-white gap-2">
                  <span className="font-semibold text-neutral-600 min-w-[120px]">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">
                      {paymentData.accountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.accountNumber, "accNum", "Account number")}
                      className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Copy Account Number"
                      aria-label="Copy Account Number"
                    >
                      {copiedKey === "accNum" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white gap-2">
                  <span className="font-semibold text-neutral-600 min-w-[120px]">Bank</span>
                  <span className="text-neutral-900 text-right">{paymentData.bank}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-neutral-50 sm:bg-white gap-2">
                  <span className="font-semibold text-neutral-600 min-w-[120px]">IFSC</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-900">
                      {paymentData.ifsc}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(paymentData.ifsc, "ifsc", "IFSC code")}
                      className="p-1 rounded text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Copy IFSC"
                      aria-label="Copy IFSC"
                    >
                      {copiedKey === "ifsc" ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
