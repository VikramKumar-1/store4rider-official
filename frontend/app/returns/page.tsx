import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, CheckCircle2, AlertCircle, Clock, ShieldCheck, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Exchange Policy | Store4Riders",
  description: "Store4Riders 7-day hassle-free size and gear exchange policy for riding jackets, helmets, boots, gloves, and accessories.",
};

export default function ExchangePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-28 sm:pt-32 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200/80">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF5429]/10 text-[#FF5429] text-xs font-bold tracking-wide uppercase mb-4">
            <ArrowLeftRight size={14} />
            Exchange Policy
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-3">
            Hassle-Free Exchange Policy
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            At Store4Riders, we want you to ride with gear that fits you perfectly. 
            Because riding safety depends on accurate sizing and gear fitment, we offer a dedicated 
            <strong className="text-slate-900"> 7-Day Size & Gear Exchange</strong> on all eligible riding essentials.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Strict Exchange-Only Policy:</span> Store4Riders operates exclusively on a size and variant replacement basis. We do not provide monetary refunds or direct returns. In the event your requested replacement size is out of stock, store credit with lifetime validity will be issued.
            </div>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-brand mb-4">
              <Clock size={22} className="text-[#FF5429]" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">7 Days Window</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Request your exchange within 7 days from the confirmed date of delivery.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-brand mb-4">
              <ShieldCheck size={22} className="text-[#FF5429]" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">Unworn & Original Tags</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gear must be unused, unwashed, and in pristine condition with all manufacturer tags and packaging intact.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-brand mb-4">
              <ArrowLeftRight size={22} className="text-[#FF5429]" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">Doorstep Pickup</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our courier partners will arrange reverse pickup directly from your delivery address upon approval.
            </p>
          </div>
        </div>

        {/* Detailed Guidelines */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6 text-sm text-slate-700">
          <section>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              1. Exchange Eligibility Criteria
            </h2>
            <ul className="space-y-2 list-disc pl-5 text-xs sm:text-sm text-slate-600">
              <li>The item must be reported for exchange within <strong>7 days</strong> of delivery.</li>
              <li>Helmets must have the original visor protective peel intact and show zero scuffs, scratches, or visor marks.</li>
              <li>Riding jackets, pants, boots, and gloves must have all original brand tags, armor pads, thermal liners, and packaging.</li>
              <li>Items showing signs of outdoor road use, dirt, perfume, sweat, or installation on a motorcycle will not qualify for exchange.</li>
              <li>Electrical accessories, intercoms, clearance/final-sale items, and customized merchandise are non-exchangeable unless defective upon initial delivery.</li>
            </ul>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ArrowLeftRight size={18} className="text-brand" />
              2. How to Request an Exchange
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-600">
              <p>
                <strong>Step 1:</strong> Visit <Link href="/account" className="text-brand font-semibold hover:underline">My Account &gt; My Orders</Link> and select the delivered order to initiate an exchange request, or email our support team at <a href="mailto:support@store4riders.com" className="text-brand font-semibold hover:underline">support@store4riders.com</a>.
              </p>
              <p>
                <strong>Step 2:</strong> Provide clear photos of the product, including tags and intact packaging, along with your desired replacement size.
              </p>
              <p>
                <strong>Step 3:</strong> Once verified by our QC team, reverse pickup is scheduled. Upon receipt and inspection at our central warehouse, the replacement size will be dispatched immediately.
              </p>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
              <HelpCircle size={18} className="text-slate-700" />
              3. Questions & Assistance
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Need assistance determining your sizing before dispatch? Reach out to our riding gear specialists directly through <Link href="/support" className="text-brand font-semibold hover:underline">Customer Support</Link> or WhatsApp. We are here to help you get the right fit on your first ride!
            </p>
          </section>
        </div>

        {/* Footer Navigation CTA */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#FF5429] hover:bg-[#e0451d] text-white font-bold text-sm px-8 py-3 rounded-xl shadow-sm transition-all"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
