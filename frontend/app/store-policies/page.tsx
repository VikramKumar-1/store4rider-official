import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowLeftRight, Truck, ShieldCheck, Clock, FileText, CheckCircle2 } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Store Policies & Customer Guide | Store4Riders",
  description:
    "Master directory and comprehensive guide to Store4Riders purchasing policies, 7-day exchanges, shipping rules, and customer support.",
  alternates: {
    canonical: "https://store4riders.com/store-policies",
  },
};

export default function StorePoliciesPage() {
  return (
    <PolicyPageLayout
      title="Store Policies & Customer Guide"
      subtitle="A quick-reference guide to all ordering, exchange, delivery, and payment guidelines at Store4Riders."
      badge="Master Policy Guide"
      badgeIcon={<BookOpen size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/store-policies"
      summaryAlert={{
        type: "info",
        title: "Customer-First Riding Experience",
        text: (
          <span>
            Every policy at Store4Riders is designed to give Indian riders complete confidence when shopping online for safety-certified helmets, jackets, boots, and gear.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Overview & Core Store Commitments</h2>
        <p>
          Store4Riders is committed to delivering authentic motorcycle safety equipment with transparent operational policies. Whether you are ordering a full-face helmet for weekend highway touring or armor upgrades for track days, we ensure clear guidelines at every stage of your purchase.
        </p>
      </section>

      <section>
        <h2>2. Quick Policy Summary Matrix</h2>
        <p>
          Below is a high-level summary of our core store policies and customer service standards:
        </p>

        <div className="overflow-x-auto my-4">
          <table className="w-full">
            <thead>
              <tr>
                <th>Policy Area</th>
                <th>Standard Terms</th>
                <th>Quick Action / Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Size & Gear Exchange</strong></td>
                <td>7 Days from delivery date</td>
                <td>Hassle-free size replacement; see <Link href="/returns" className="text-brand font-bold hover:underline">Exchange Policy</Link></td>
              </tr>
              <tr>
                <td><strong>Order Dispatch SLA</strong></td>
                <td>Within 24 to 48 Hours</td>
                <td>Same-day dispatch for orders before 2:00 PM IST; see <Link href="/shipping" className="text-brand font-bold hover:underline">Shipping Policy</Link></td>
              </tr>
              <tr>
                <td><strong>Cash on Delivery (COD)</strong></td>
                <td>Available on select pincodes</td>
                <td>Mandatory order verification call; see <Link href="/cash-on-delivery" className="text-brand font-bold hover:underline">COD Guidelines</Link></td>
              </tr>
              <tr>
                <td><strong>Product Authenticity</strong></td>
                <td>100% Genuine with Brand Warranty</td>
                <td>Authorized Indian distributor stock; see <Link href="/warranty" className="text-brand font-bold hover:underline">Warranty Terms</Link></td>
              </tr>
              <tr>
                <td><strong>Order Cancellations</strong></td>
                <td>Permitted prior to dispatch</td>
                <td>Full refund or store credit issued within 3-5 business days</td>
              </tr>
              <tr>
                <td><strong>Customer Support Desk</strong></td>
                <td>Mon - Sat: 10AM - 7PM IST</td>
                <td>Direct phone, email &amp; WhatsApp support via <Link href="/contact-us" className="text-brand font-bold hover:underline">Contact Desk</Link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. Order Placement & Cancellation Policy</h2>
        <ul>
          <li>
            <strong>Before Dispatch:</strong> You may cancel any standard in-stock order free of charge before the parcel is handed over to our courier partner. You can initiate a cancellation from <strong>My Account &gt; Order History</strong> or by contacting our support team via WhatsApp or email.
          </li>
          <li>
            <strong>After Dispatch:</strong> Once an order has been assigned an Air Waybill (AWB) number and handed over to the courier logistics network, it cannot be canceled in transit. You may accept the delivery and initiate a standard size exchange if needed.
          </li>
          <li>
            <strong>Pre-Orders & Special Imports:</strong> Certain high-end racing helmets or custom-imported suits are sourced specifically upon customer confirmation and may have dedicated cancellation terms communicated at the time of booking.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Price Integrity & Promotional Discounts</h2>
        <p>
          We take pride in offering fair, competitive pricing across our catalog. All prices listed on Store4Riders represent the Maximum Retail Price (MRP) or discounted promotional rates inclusive of applicable Goods and Services Tax (GST).
        </p>
        <p>
          Discount coupon codes, promotional store credits, and sale discounts are subject to specific validity dates and minimum order values. Multiple coupon codes cannot be stacked on a single order unless explicitly stated.
        </p>
      </section>

      <section>
        <h2>5. Store Credit Terms & Lifetime Validity</h2>
        <p>
          In instances where an exchange item or replacement size is out of stock with the manufacturer, Store4Riders issues an equivalent <strong>Store Credit Voucher</strong> to your account:
        </p>
        <ul>
          <li>Store credits carry <strong>lifetime validity</strong> and do not expire.</li>
          <li>Store credits may be applied across any product category, brand, or accessory on our website.</li>
          <li>Store credits are linked securely to your registered account phone number and email.</li>
        </ul>
      </section>

      <section>
        <h2>6. Detailed Policy Directory</h2>
        <p>
          For specific, exhaustive legal and operational terms, explore our dedicated policy sections:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <Link
            href="/returns"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand/40 transition-all flex items-start gap-3 group"
          >
            <ArrowLeftRight className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors text-sm">
                Exchange &amp; Replacement Policy
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                7-day size swap rules, return QC parameters, and reverse pickup steps.
              </p>
            </div>
          </Link>

          <Link
            href="/shipping"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand/40 transition-all flex items-start gap-3 group"
          >
            <Truck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors text-sm">
                Shipping &amp; Delivery Policy
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Courier timelines, free delivery thresholds, and packaging standards.
              </p>
            </div>
          </Link>

          <Link
            href="/warranty"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand/40 transition-all flex items-start gap-3 group"
          >
            <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors text-sm">
                Warranty &amp; Claims Policy
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Manufacturer coverage durations, defect definitions, and claim guide.
              </p>
            </div>
          </Link>

          <Link
            href="/terms"
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-brand/40 transition-all flex items-start gap-3 group"
          >
            <FileText className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 group-hover:text-brand transition-colors text-sm">
                Conditions of Sale &amp; Use
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Terms of service, account rules, liability limits, and Pune jurisdiction.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </PolicyPageLayout>
  );
}
