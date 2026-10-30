import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, ShieldCheck, Box, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy | Store4Riders",
  description:
    "Fast, reliable pan-India courier shipping for motorcycle helmets and riding gear with safe packaging and real-time tracking.",
  alternates: {
    canonical: "https://store4riders.com/shipping",
  },
};

export default function ShippingPage() {
  return (
    <PolicyPageLayout
      title="Shipping & Delivery Policy"
      subtitle="Fast, dependable pan-India logistics engineered to deliver high-value motorcycle gear safely to your doorstep."
      badge="Pan-India Logistics"
      badgeIcon={<Truck size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/shipping"
      summaryAlert={{
        type: "success",
        title: "Free Express Shipping on Orders Above Threshold",
        text: (
          <span>
            Enjoy free express delivery across all serviceable Indian pincodes on qualifying orders. Orders placed before 2:00 PM IST on business days are dispatched from our central warehouse within 24 to 48 hours.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Pan-India Delivery Timelines</h2>
        <p>
          Store4Riders operates from our central warehouse and fulfillment hub in <strong>Pune, Maharashtra</strong>. We partner with Tier-1 express air and surface logistics carriers to ensure fast, reliable transit across 19,000+ postal pincodes in India.
        </p>

        <div className="overflow-x-auto my-4">
          <table className="w-full">
            <thead>
              <tr>
                <th>Region / Destination</th>
                <th>Estimated Transit Time</th>
                <th>Logistics Mode</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Maharashtra, Pune & Mumbai Metro</strong></td>
                <td>1 to 2 Business Days</td>
                <td>Direct Regional Express</td>
              </tr>
              <tr>
                <td><strong>Tier-1 Metros (Bengaluru, Delhi NCR, Hyderabad, Chennai, Kolkata)</strong></td>
                <td>2 to 4 Business Days</td>
                <td>Express Air Cargo / Dedicated Surface</td>
              </tr>
              <tr>
                <td><strong>Tier-2 & Tier-3 Cities (State Capitals & Major Towns)</strong></td>
                <td>4 to 6 Business Days</td>
                <td>Express Surface Logistics</td>
              </tr>
              <tr>
                <td><strong>North East, J&K, Ladakh & Remote Outlying Pin Codes</strong></td>
                <td>7 to 10 Business Days</td>
                <td>Special Logistics / India Post Speed Post</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 italic">
          *Note: Transit times exclude Sundays and national public holidays. Unforeseen weather disruptions, regional transport strikes, or festive sale peaks may cause brief delivery delays.
        </p>
      </section>

      <section>
        <h2>2. Dispatch SLAs & Processing Times</h2>
        <p>
          We pride ourselves on prompt order fulfillment:
        </p>
        <ul>
          <li>
            <strong>Same-Day / Next-Day Dispatch:</strong> In-stock orders placed before <strong>2:00 PM IST</strong> (Monday through Saturday) are typically verified, quality-inspected, and packaged for courier pickup on the same business day.
          </li>
          <li>
            <strong>Weekend Orders:</strong> Orders placed after 2:00 PM on Saturday or during Sunday are dispatched on the immediate following Monday.
          </li>
          <li>
            <strong>Pre-Dispatch Quality Inspection:</strong> Before any riding helmet, jacket, or boot carton is sealed, our warehouse team conducts a physical inspection to verify tag integrity, visor condition, zipper operation, and correct size labeling.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Shipping Rates & Free Delivery</h2>
        <p>
          Shipping charges, if applicable, are computed transparently at checkout based on order total and delivery pincode:
        </p>
        <ul>
          <li>
            <strong>Free Express Delivery:</strong> All standard prepaid orders exceeding the free delivery threshold receive complimentary express shipping.
          </li>
          <li>
            <strong>Nominal Standard Fee:</strong> For orders below the free shipping threshold, a nominal flat packaging and shipping charge is added to cover secure transit.
          </li>
          <li>
            <strong>Cash on Delivery (COD) Handling:</strong> A nominal convenience handling fee applies to Cash on Delivery shipments to cover door-to-door cash collection and reverse logistics insurance.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Premier Courier Logistics Partners</h2>
        <p>
          We partner exclusively with reputable, insured courier networks including:
        </p>
        <ul>
          <li><strong>Delhivery Express</strong> (Pan-India air & surface network)</li>
          <li><strong>BlueDart / DHL Aviation</strong> (Priority express metro network)</li>
          <li><strong>DTDC Express Cargo</strong> (Heavy luggage and boot shipments)</li>
          <li><strong>India Post Speed Post</strong> (Special remote coverage)</li>
        </ul>
      </section>

      <section>
        <h2>5. Live Shipment Tracking & Notifications</h2>
        <p>
          As soon as your parcel is handed over to the courier partner, an automated shipment confirmation notification containing your unique <strong>Air Waybill (AWB) Tracking Number</strong> and direct tracking URL is sent to your registered mobile number and email.
        </p>
        <p>
          You can also track your shipment live at any time by visiting{" "}
          <Link href="/account/orders" className="text-brand hover:underline font-bold">
            My Account &gt; Order History
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>6. Armor & Helmet Packaging Standards</h2>
        <p>
          Motorcycle gear represents vital safety equipment. We follow strict packaging protocols to eliminate transit vibrations and impact risks:
        </p>
        <ul>
          <li>
            <strong>Helmets:</strong> Packed in their original manufacturer protective fabric dust bags, cushioned with shock-absorbent air bubbles, and housed inside reinforced double-corrugated shipping boxes. Visor protective films remain untouched.
          </li>
          <li>
            <strong>Riding Jackets & Pants:</strong> Enclosed in waterproof heavy-gauge polythene liners to guard against monsoon moisture and external road dust.
          </li>
          <li>
            <strong>Luggage & Electronics:</strong> Bluetooth communicators and fragile accessories receive specialized bubble wrap and sealed security tape.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Protocol for Damaged or Tampered Parcels</h2>
        <blockquote>
          <strong>Important Delivery Advice:</strong> Please inspect the outer shipping package before accepting delivery from the courier representative.
        </blockquote>
        <p>
          If you observe noticeable crushing, tears, or tampered branded adhesive tape:
        </p>
        <ol>
          <li>Do not share the delivery confirmation OTP until you have verified the outer carton condition.</li>
          <li>In cases of evident severe damage or open cartons, refuse delivery and immediately notify our support team.</li>
          <li>
            We strongly recommend recording a continuous, uncut <strong>unboxing video</strong> when opening your parcel. This provides clear documentation in the rare event of transit damage or missing accessories, allowing our team to process an immediate replacement without courier disputes.
          </li>
        </ol>
      </section>
    </PolicyPageLayout>
  );
}
