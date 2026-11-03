"use client";

import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, Check, Smartphone, Building2, ShieldCheck, MessageSquare, ArrowRight, Download } from "lucide-react";

export const GpayPaymentDetails: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const paymentData = {
    phone: "9834999284",
    vpa: "9834999284@okbizaxis",
    name: "Motohive Media Pvt. Ltd.",
    accountNumber: "916020025974548",
    bankName: "Axis Bank",
    branch: "Appa Balwant Chowk, Pune, Maharashtra",
    ifsc: "UTIB0002840",
    whatsapp: "+91 72630 07788",
    whatsappLink: "https://wa.me/917263007788?text=" + encodeURIComponent("Hi Store4Riders, I have completed the payment via GPay/PhonePe/Bank. Here is my payment proof with Order Reference:"),
    upiUri: "upi://pay?pa=9834999284@okbizaxis&pn=Motohive%20Media%20Pvt%20Ltd&cu=INR"
  };

  const copyToClipboard = async (text: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      toast.error("Could not copy text");
    }
  };

  return (
    <div className="space-y-8 my-6">
      
      {/* Quick UPI & Google Pay Card */}
      <div className="bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          
          <div className="flex-1 space-y-4 text-left w-full">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Official Verified Business Account
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Google Pay &amp; PhonePe Details
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Scan or copy verified details for instant advance payments or order fulfillment.
              </p>
            </div>

            {/* Credential Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              
              {/* Phone / GPay Number */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">GPay / PhonePe Mobile</span>
                  <strong className="text-sm sm:text-base font-mono text-white tracking-wide">{paymentData.phone}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentData.phone, "phone", "Mobile Number")}
                  className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "phone" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedKey === "phone" ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* UPI ID / VPA */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider block">Official Merchant UPI ID</span>
                  <strong className="text-sm sm:text-base font-mono text-emerald-400 tracking-wide">{paymentData.vpa}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(paymentData.vpa, "vpa", "UPI ID")}
                  className="bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  {copiedKey === "vpa" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedKey === "vpa" ? "Copied" : "Copy"}</span>
                </button>
              </div>

            </div>

            {/* Beneficiary Name Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs flex items-start gap-2">
              <span className="text-base shrink-0 mt-0.5">ℹ️</span>
              <p className="leading-relaxed">
                When entering the UPI ID or phone number in your Google Pay, PhonePe, or Paytm app, ensure the recipient name verifies as <strong>&ldquo;Motohive Media Pvt. Ltd.&rdquo;</strong> before authorizing payment.
              </p>
            </div>

            {/* Mobile Pay Action */}
            <div className="pt-2 flex flex-wrap gap-2.5">
              <a
                href={paymentData.upiUri}
                className="bg-banner hover:bg-orange-600 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
              >
                <Smartphone size={16} />
                <span>Open in Any UPI App</span>
              </a>

              <a
                href={paymentData.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all"
              >
                <MessageSquare size={16} />
                <span>Share Proof on WhatsApp</span>
              </a>
            </div>

          </div>

          {/* Official Store4Riders Google Pay & PhonePe Scanner Standee */}
          <div className="flex flex-col items-center justify-center shrink-0 w-full lg:w-auto">
            <div className="relative w-56 sm:w-64 aspect-[726/1024] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-[#1967d2]">
              <Image 
                src="/upi-qr-scanner.webp" 
                alt="Store4Riders Official Google Pay & PhonePe UPI Scanner" 
                fill 
                sizes="(max-width: 640px) 224px, 256px"
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <a
              href="/upi-qr-scanner.webp"
              target="_blank"
              rel="noopener noreferrer"
              download="Store4Riders-UPI-QR.webp"
              className="mt-2.5 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors underline underline-offset-4"
            >
              <Download size={13} />
              <span>Download Official QR Scanner</span>
            </a>
          </div>

        </div>

      </div>

      {/* Official Axis Bank Account Details (NEFT / IMPS / RTGS) */}
      <div className="p-6 sm:p-8 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base sm:text-lg">
              Official Current Account Details (NEFT / RTGS / IMPS)
            </h4>
            <p className="text-xs text-slate-500">
              For direct netbanking transfers from any bank account in India.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Name</span>
            <strong className="text-sm text-slate-900 font-semibold block mt-0.5">{paymentData.name}</strong>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Type</span>
            <strong className="text-sm text-slate-900 font-semibold block mt-0.5">Current Account</strong>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Account Number</span>
              <strong className="text-sm font-mono text-slate-900 block mt-0.5">{paymentData.accountNumber}</strong>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(paymentData.accountNumber, "acc", "Account Number")}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              {copiedKey === "acc" ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bank Name</span>
            <strong className="text-sm text-slate-900 font-semibold block mt-0.5">{paymentData.bankName}</strong>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">IFSC Code</span>
              <strong className="text-sm font-mono text-brand font-bold block mt-0.5">{paymentData.ifsc}</strong>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(paymentData.ifsc, "ifsc", "IFSC Code")}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              {copiedKey === "ifsc" ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Branch</span>
            <strong className="text-xs text-slate-700 block mt-0.5">{paymentData.branch}</strong>
          </div>

        </div>
      </div>

    </div>
  );
};
