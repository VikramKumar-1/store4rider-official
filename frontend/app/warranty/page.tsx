import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Award, AlertCircle, Wrench, CheckCircle2 } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Warranty & Claim Policy | Store4Riders",
  description:
    "Official manufacturer warranty coverage details, genuine product guarantee, and step-by-step claim procedures for riding gear at Store4Riders.",
  alternates: {
    canonical: "https://store4riders.com/warranty",
  },
};

export default function WarrantyPage() {
  return (
    <PolicyPageLayout
      title="Warranty & Claim Policy"
      subtitle="Every piece of gear sold by Store4Riders is 100% genuine and backed by official manufacturer warranty coverage across India."
      badge="Manufacturer Warranty"
      badgeIcon={<ShieldCheck size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/warranty"
      summaryAlert={{
        type: "info",
        title: "100% Authorized Retailer Guarantee",
        text: (
          <span>
            Store4Riders is an authorized dealer and partner for all brands represented on our store. Your official Store4Riders invoice acts as valid proof of purchase for all warranty claims across authorized brand service centers in India.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Genuine Product & Manufacturer Warranty Coverage</h2>
        <p>
          At Store4Riders, rider safety is our foremost commitment. We source all motorcycle riding helmets, protective jackets, pants, boots, gloves, luggage, and Bluetooth communicators directly from certified brand manufacturers and their authorized national distributors.
        </p>
        <p>
          All products come with genuine manufacturer warranty coverage against defects in materials and craftsmanship from the date of original purchase.
        </p>
      </section>

      <section>
        <h2>2. Typical Warranty Durations by Category</h2>
        <p>
          Warranty terms and durations are determined by the individual brand manufacturers. Below is a standard summary of typical coverage periods:
        </p>

        <div className="overflow-x-auto my-4">
          <table className="w-full">
            <thead>
              <tr>
                <th>Gear Category</th>
                <th>Standard Coverage Duration</th>
                <th>Covered Components</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Helmets (MT, SMK, Axor, LS2, Shoei)</strong></td>
                <td>1 Year to 5 Years (Brand specific)</td>
                <td>EPS liner bonding, outer shell structural integrity, chin strap rivet assembly, top vent mechanisms.</td>
              </tr>
              <tr>
                <td><strong>Riding Jackets & Pants (Rynox, Solace, Korda)</strong></td>
                <td>6 Months to 1 Year</td>
                <td>Main seam stitching, primary YKK zipper sliders, velcro fasteners, CE armor pocket integrity.</td>
              </tr>
              <tr>
                <td><strong>Riding Boots & Shoes (TCX, Falco, Forma, Clan)</strong></td>
                <td>6 Months to 1 Year</td>
                <td>Sole delamination / separation, buckle and ratchet mechanisms, structural waterproof membrane leaks.</td>
              </tr>
              <tr>
                <td><strong>Bluetooth Intercoms (Sena, Cardo, Parani)</strong></td>
                <td>1 Year to 2 Years</td>
                <td>Internal electronic circuitry, speaker drivers, microphone wiring, Bluetooth module failure.</td>
              </tr>
              <tr>
                <td><strong>Motorcycle Luggage & Tail Bags</strong></td>
                <td>6 Months to 1 Year</td>
                <td>Strap buckle stitching, seam integrity, zipper track defects under normal loading.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>3. What Is Covered Under Warranty</h2>
        <p>
          Manufacturer warranty covers defects arising purely from manufacturing, faulty material batching, or assembly errors during normal intended use:
        </p>
        <ul>
          <li>Defective structural stitching on primary seams of jackets, pants, or boots.</li>
          <li>Failure of genuine zipper teeth or slider locks during standard operation.</li>
          <li>Detachment or delamination of boot outsoles under normal riding and walking conditions.</li>
          <li>Internal electronic malfunction of Bluetooth intercom units not caused by liquid submersion or physical impact.</li>
          <li>Premature breakdown or failure of integrated helmet visor ratchet base plates.</li>
        </ul>
      </section>

      <section>
        <h2>4. Exclusions (What Is NOT Covered)</h2>
        <p>
          Warranty coverage is designed to protect against factory defects. It does not cover damage resulting from accidents, external abuse, or natural product aging:
        </p>
        <ul>
          <li>
            <strong>Crash Damage & High-Impact Collisions:</strong> Gear that has sustained damage in a crash or road accident has fulfilled its protective role and cannot be claimed under warranty.
          </li>
          <li>
            <strong>Dropped Helmets:</strong> Helmets dropped on hard surfaces (asphalt, concrete) can compromise the internal EPS foam liner and are not covered.
          </li>
          <li>
            <strong>Visor Scratches & Pinlock Degradation:</strong> Helmet visors, internal sun shields, and Pinlock anti-fog lenses are subject to road grit, cleaning abrasion, and road debris; scratches are excluded from warranty.
          </li>
          <li>
            <strong>Improper Care & Harsh Chemical Cleaning:</strong> Degradation caused by machine washing armored gear without removing protectors, dry-cleaning leather, or using petroleum-based solvents on helmet shells.
          </li>
          <li>
            <strong>Normal Wear and Tear:</strong> Natural fading from prolonged sunlight exposure, fabric pillage, boot sole tread wear over thousands of kilometers, and cosmetic abrasions.
          </li>
          <li>
            <strong>Unauthorized Modifications:</strong> Cutting straps, altering armor pockets, custom paint jobs, or installing unapproved aftermarket accessories that modify product structure.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Step-by-Step Warranty Claim Procedure</h2>
        <p>
          Store4Riders acts as your dedicated brand liaison to ensure prompt evaluation and resolution. To submit a claim, follow these simple steps:
        </p>

        <div className="space-y-4 my-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Gather Documentation</h4>
              <p className="text-xs text-slate-600 mt-1">
                Have your Store4Riders Order ID, registered email/phone, and official invoice ready (available anytime in <strong>My Account &gt; Orders</strong>).
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Capture Clear Photos & Video</h4>
              <p className="text-xs text-slate-600 mt-1">
                Take high-resolution photos of the overall product, brand tags/labels showing batch/serial numbers, and close-up photos or a brief 10-second video demonstrating the defect.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Submit Claim to Support</h4>
              <p className="text-xs text-slate-600 mt-1">
                Email your claim details to <strong className="text-brand">warranty@store4riders.com</strong> or contact our support team via WhatsApp with the subject line: <em>&ldquo;Warranty Claim - Order #[Your-Order-ID]&rdquo;</em>.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <span className="w-7 h-7 rounded-full bg-brand text-white font-bold text-xs flex items-center justify-center shrink-0">
              4
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Inspection & Resolution</h4>
              <p className="text-xs text-slate-600 mt-1">
                Our technical team will review the photos with the brand&apos;s authorized quality-control team within 48 to 72 business hours. If physical inspection is required, we will guide you on secure transit to the service hub.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>6. Resolution Options</h2>
        <p>
          Upon inspection and approval of a valid warranty claim by the brand manufacturer, resolution will be provided in one of the following forms in accordance with brand policy:
        </p>
        <ul>
          <li><strong>Authorized Factory Repair:</strong> Replacement of defective zipper sliders, buckle stitching, or helmet base plates using original factory parts.</li>
          <li><strong>Direct Product Replacement:</strong> In cases of irreparable structural defects, a brand-new replacement unit of the same model and size will be dispatched.</li>
          <li><strong>Store Credit / Alternate Model:</strong> If the exact discontinued model is no longer produced, store credit or an equivalent upgraded model will be offered.</li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
