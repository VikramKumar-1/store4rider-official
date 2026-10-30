import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cash on Delivery | Store4Riders",
  description: "Information regarding Cash on Delivery (COD) payment options at Store4Riders.",
};

export default function CashOnDeliveryPage() {
  return (
    <div className="min-h-[70vh] bg-neutral-950 text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-neutral-800 pb-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Cash on Delivery (COD)</h1>
          <p className="text-neutral-400 mt-2 text-base md:text-lg">Policies and guidelines for Cash on Delivery orders.</p>
        </div>
        <div className="space-y-6 text-neutral-300 leading-relaxed text-base">
          <p>
            Cash on Delivery is available for eligible pin codes across India on select items.
          </p>
          <p>
            To ensure secure and reliable delivery of high-value riding gear, orders may be confirmed via WhatsApp or phone call prior to dispatch.
          </p>
          <p>
            Please inspect the outer package before accepting delivery from the courier. In case of any questions, reach out to our support team at <span className="text-brand font-medium">contact@store4riders.com</span>.
          </p>
        </div>
        <div className="pt-6">
          <Link href="/" className="inline-block bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-3 rounded-md transition-all">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
