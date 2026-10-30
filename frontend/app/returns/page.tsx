import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, CheckCircle2, AlertCircle, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { buildFAQSchema } from "@/core/utils/seo-schema";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Exchange & Replacement Policy | Store4Riders",
  description:
    "Store4Riders 7-day hassle-free size and gear exchange policy for riding jackets, helmets, boots, gloves, and accessories.",
  alternates: {
    canonical: "https://store4riders.com/returns",
  },
};

export default function ExchangePolicyPage() {
  const faqSchema = buildFAQSchema([
    {
      question: "What is the Store4Riders exchange window?",
      answer:
        "We offer a dedicated 7-day size and gear replacement exchange window from the confirmed date of delivery.",
    },
    {
      question: "What products qualify for exchange?",
      answer:
        "Riding jackets, pants, boots, helmets, and gloves must be unused, unwashed, and in pristine condition with all manufacturer tags, armor inserts, and original packaging intact. Helmet visor protective peels must remain unpeeled.",
    },
    {
      question: "How do I request an exchange?",
      answer:
        "Visit My Account > My Orders and select the delivered order, or email our support team at support@store4riders.com with photos of the gear and your desired replacement size.",
    },
    {
      question: "Is doorstep reverse pickup provided?",
      answer:
        "Yes, our courier logistics partners arrange reverse doorstep pickup directly from your delivery address upon QC authorization.",
    },
  ]);

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <PolicyPageLayout
        title="Exchange & Replacement Policy"
        subtitle="Because motorcycle safety depends on a precise, secure fit, Store4Riders provides a dedicated 7-Day Size & Gear Exchange on all eligible riding essentials."
        badge="7-Day Fit Guarantee"
        badgeIcon={<ArrowLeftRight size={14} className="text-brand shrink-0" />}
        lastUpdated="October 2026"
        currentSlug="/returns"
        summaryAlert={{
          type: "warning",
          title: "Strict Exchange-Only Policy",
          text: (
            <span>
              Store4Riders operates exclusively on a size and variant replacement basis. We do not provide monetary cash refunds. If your requested replacement size is temporarily out of stock with the manufacturer, store credit with lifetime validity will be issued.
            </span>
          ),
        }}
      >
        <section>
          <h2>1. Three Core Pillars of Our Exchange Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3">
                <Clock size={20} className="text-brand" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1 mt-0">
                7-Day Window
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-0">
                Request your exchange within 7 days from the confirmed date of delivery.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3">
                <ShieldCheck size={20} className="text-brand" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1 mt-0">
                Unworn &amp; Tags Intact
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-0">
                Gear must be unused and unwashed with all tags, armor, and box intact.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3">
                <ArrowLeftRight size={20} className="text-brand" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1 mt-0">
                Doorstep Pickup
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-0">
                Courier partners arrange reverse pickup directly from your address.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2>2. Exchange Eligibility Criteria</h2>
          <p>
            To qualify for a hassle-free size or color variant exchange, the returned gear must satisfy our quality-control parameters:
          </p>
          <ul>
            <li>
              The exchange request must be initiated within <strong>7 days</strong> of the confirmed delivery date.
            </li>
            <li>
              <strong>Helmets:</strong> Must have the original factory visor protective peel completely intact and unpeeled. Zero scuffs, scratches, hair, or forehead sweat marks.
            </li>
            <li>
              <strong>Jackets &amp; Pants:</strong> Must include all original brand tags, CE armor inserts, and removable thermal/waterproof liners.
            </li>
            <li>
              <strong>Boots &amp; Shoes:</strong> Must be tried on indoors on clean surfaces only; outsoles must be free of road dust, pebbles, or pedal teeth marks.
            </li>
            <li>
              Items showing signs of outdoor road use, motorcycle mounting, cosmetic odors, or wash cycles cannot be accepted.
            </li>
            <li>
              Electrical accessories, Bluetooth intercoms (once packaging seal is broken), and clearance/final-sale items are non-exchangeable unless functionally defective upon initial delivery.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Step-by-Step: How to Request an Exchange</h2>
          <div className="space-y-4 my-6">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Initiate Online</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Visit <Link href="/account" className="text-brand font-bold hover:underline">My Account &gt; Order History</Link>, select your delivered order, and click <em>Request Size Exchange</em>, or email our support desk at <strong className="text-brand">support@store4riders.com</strong>.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Provide Fit Photos</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Share quick photos showing the gear with tags intact and your desired replacement size. Our team confirms availability within 24 hours.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Doorstep Reverse Pickup &amp; Replacement</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Our courier arranges reverse doorstep pickup. Upon receipt and quick QC at our central warehouse in Pune, your replacement size is dispatched immediately.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>4. Sizing Consultation Before Exchange</h2>
          <p>
            Unsure whether to size up or down? Connect directly with our riding gear specialists on WhatsApp or call our support helpline before requesting your swap. We are dedicated to ensuring you get the exact fit for safe, comfortable riding.
          </p>
        </section>
      </PolicyPageLayout>
    </>
  );
}
