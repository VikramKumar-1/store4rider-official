import type { Metadata } from "next";
import Link from "next/link";
import { Clock, PhoneCall, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Cash on Delivery (COD) Policy & Guidelines | Store4Riders",
  description:
    "Learn about Cash on Delivery options, order verification procedures, eligible pin codes, and doorstep payment rules at Store4Riders.",
  alternates: {
    canonical: "https://store4riders.com/cash-on-delivery",
  },
};

export default function CashOnDeliveryPage() {
  return (
    <PolicyPageLayout
      title="Cash on Delivery (COD) Guidelines"
      subtitle="Guidelines, verification procedures, and doorstep payment terms for Cash on Delivery orders at Store4Riders."
      badge="Payment Options"
      badgeIcon={<Clock size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/cash-on-delivery"
      summaryAlert={{
        type: "warning",
        title: "Mandatory Order Verification Process",
        text: (
          <span>
            To ensure secure dispatch and protect fragile motorcycle safety gear from unnecessary transit handling, all Cash on Delivery orders undergo phone or WhatsApp confirmation by our team before dispatch.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Cash on Delivery Availability</h2>
        <p>
          Store4Riders offers Cash on Delivery (COD) across thousands of serviceable postal pincodes throughout India. When available for your delivery address, the COD option will automatically appear on the payment selection step during checkout.
        </p>
        <p>
          Please note that certain remote regions, high-risk courier areas, or specialized custom-order items may be restricted to prepaid payment methods (UPI, Cards, Net Banking, or Snapmint EMI).
        </p>
      </section>

      <section>
        <h2>2. Pre-Dispatch Verification Process</h2>
        <p>
          Motorcycle helmets and armored gear represent high-value, fragile equipment that requires careful shipping logistics. To avoid fraudulent orders, address errors, and unauthorized purchases, we follow a strict pre-dispatch verification procedure:
        </p>

        <div className="space-y-4 my-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <PhoneCall className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Verification Call / WhatsApp Prompt</h4>
              <p className="text-xs text-slate-600 mt-1">
                Within 2 to 4 hours of placing a COD order, our customer care team will reach out via phone call or an official Store4Riders WhatsApp message to verify your delivery address, correct gear size, and availability.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Confirmation Window</h4>
              <p className="text-xs text-slate-600 mt-1">
                Once confirmed, your order status updates to &ldquo;Processing&rdquo; and proceeds immediately to warehouse quality inspection and packaging. Unreachable numbers or unconfirmed orders are held for 48 hours before automated cancellation.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>3. Partial Advance Payment for High-Value Orders</h2>
        <p>
          For select high-value gear categories (such as imported racing helmets, leather suits, or orders exceeding ₹10,000), Store4Riders may require a nominal partial booking advance (typically 10% to 20% or ₹500 - ₹1,000) payable securely online via UPI or card.
        </p>
        <ul>
          <li>The remaining balance is paid directly in cash or digital mode to the delivery agent at your doorstep.</li>
          <li>
            This partial advance confirms the buyer&apos;s commitment and covers the courier reverse logistics insurance in case the shipment is returned unattempted.
          </li>
          <li>
            If you cancel the order before dispatch, this partial advance is 100% refunded to your original payment source.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Doorstep Payment Methods</h2>
        <p>
          When the courier logistics partner arrives at your address with your package:
        </p>
        <ul>
          <li>
            <strong>Cash Payment:</strong> You may pay the exact order amount in Indian Rupee currency notes. Delivery couriers rarely carry large change, so keeping exact change ready is appreciated.
          </li>
          <li>
            <strong>Doorstep UPI / Dynamic QR:</strong> Most delivery agents from Delhivery and BlueDart carry handheld POS devices that generate a dynamic UPI QR code on their screen. You can scan and pay via Google Pay, PhonePe, Paytm, or BHIM right at your doorstep.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Open Box Delivery & Inspection Guidelines</h2>
        <p>
          Courier company policies dictate that the cash or UPI payment must be completed and OTP provided before handing over the sealed package.
        </p>
        <p>
          However, <strong>you must inspect the outer packaging</strong> before paying. If the outer shipping box is severely crushed, punctured, torn, or has broken security tape, please photograph the carton and immediately refuse the delivery.
        </p>
      </section>

      <section>
        <h2>6. Size Exchanges on COD Orders</h2>
        <p>
          COD orders enjoy the exact same <strong>7-Day Size and Gear Exchange Guarantee</strong> as prepaid orders! If the jacket, boots, or helmet you received does not fit properly, simply visit{" "}
          <Link href="/returns" className="text-brand hover:underline font-bold">
            Exchange Policy
          </Link>{" "}
          or reach out to our support team within 7 days of delivery to arrange a replacement.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
