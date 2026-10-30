import type { Metadata } from "next";
import Link from "next/link";
import { Compass, PhoneCall, MessageSquare, ShieldCheck, CheckCircle2, UserCheck, Ruler } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Rider Assist & Gear Consultation | Store4Riders",
  description:
    "Get expert motorcycle gear consultation, helmet head-shape sizing, armor placement advice, and personalized recommendations from Store4Riders Rider Assist.",
  alternates: {
    canonical: "https://store4riders.com/rider-assist",
  },
};

export default function RiderAssistPage() {
  return (
    <PolicyPageLayout
      title="Rider Assist & Sizing Consultation"
      subtitle="Free, personalized one-on-one consultation from active motorcyclists to help you select the exact fit, safety level, and gear setup for your ride."
      badge="Expert Advisory Desk"
      badgeIcon={<Compass size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/rider-assist"
      summaryAlert={{
        type: "brand",
        title: "Proper Fit Saves Lives",
        text: (
          <span>
            A helmet that rotates freely on your head or jacket armor that shifts away from your elbow during a slide cannot provide certified impact protection. Our certified gear consultants ensure you get the perfect fit before dispatch.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. What Is Rider Assist?</h2>
        <p>
          Buying technical riding gear online can feel overwhelming. Sizing standards differ between European (Alpinestars, TCX, MT Helmets), American (Icon, Bell), and Indian (Rynox, Axor, Solace) manufacturers.
        </p>
        <p>
          <strong>Rider Assist</strong> is Store4Riders&apos; complimentary advisory service staffed by experienced motorcycle tourers, track riders, and equipment specialists. We review your body measurements, riding posture, motorcycle ergonomics, and seasonal climates to recommend gear that fits like a second skin.
        </p>
      </section>

      <section>
        <h2>2. Helmet Sizing &amp; Head Shape Analysis</h2>
        <p>
          Helmet sizing is about more than just circumference. The internal crown shape must match your cranial contour to prevent painful pressure points (&ldquo;hot spots&rdquo;) or dangerous looseness:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Round Oval</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Front-to-back and side-to-side skull dimensions are nearly equal. Common among many Asian riders.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-brand/30 bg-brand/5">
            <h4 className="font-bold text-brand text-sm mb-1">Intermediate Oval (Most Common)</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Front-to-back length is slightly longer than side-to-side width. Standard shape for MT, SMK, Axor, and Shoei.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Long Oval</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Significantly longer from forehead to back of head, narrower across the temples. Requires specific shell geometries.
            </p>
          </div>
        </div>

        <p>
          <strong>How to measure your head:</strong> Use a flexible tailor&apos;s measuring tape wrapped horizontally around the widest part of your head—approximately 2.5 cm (1 inch) above your eyebrows and just above your ears.
        </p>
      </section>

      <section>
        <h2>3. Jacket &amp; Armor Positioning Checks</h2>
        <p>
          When trying on a motorcycle jacket, casual streetwear sizing rules do not apply:
        </p>
        <ul>
          <li>
            <strong>Riding Posture Simulation:</strong> Sit on your motorcycle or mimic your riding handlebar reach. Sleeves should cover your wrists without riding up, and the jacket should not bunch uncomfortably at the throat or chest.
          </li>
          <li>
            <strong>Elbow &amp; Shoulder Armor:</strong> CE Level 1 or Level 2 armor cups should sit centered over the bony protrusions of your elbows and shoulders when your arms are bent in riding position.
          </li>
          <li>
            <strong>Back Protector Coverage:</strong> The spine protector should cover from the base of your neck (C7 vertebra) down to your lumbar region without pushing upward against your helmet rim.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Riding Discipline Recommendations</h2>
        <div className="overflow-x-auto my-4">
          <table className="w-full">
            <thead>
              <tr>
                <th>Riding Style</th>
                <th>Recommended Gear Focus</th>
                <th>Key Features to Look For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Highway Touring &amp; Expeditions</strong></td>
                <td>All-Weather Textile Jackets, Modular / Dual-Sport Helmets</td>
                <td>Hydration bladder pockets, removable thermal/rain liners, high ventilation zips, CE Level 2 armor.</td>
              </tr>
              <tr>
                <td><strong>City &amp; Daily Commute</strong></td>
                <td>Breathable Heavy Mesh Jackets, Short Gauntlet Gloves, Riding Shoes</td>
                <td>Maximum airflow mesh panels, lightweight flexible protectors, ankle malleolus protection.</td>
              </tr>
              <tr>
                <td><strong>Track Days &amp; Fast Road</strong></td>
                <td>Full Leather Suits, Full-Gauntlet Gloves, Track Boots</td>
                <td>1.2 - 1.4mm full-grain cowhide leather, Knox scaphoid palm sliders, double D-ring helmet strap, TPU sliders.</td>
              </tr>
              <tr>
                <td><strong>Adventure &amp; Off-Road Trails</strong></td>
                <td>Adventure Helmets with Peak, MX Gloves, Articulated Knee Guards</td>
                <td>Sun peak visor, goggle compatibility, heavy dirt ventilation, high-impact knee shin protectors.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>5. Connect with a Rider Advisor</h2>
        <p>
          Ready to verify your measurements or compare two helmets before ordering? Connect directly with our rider advisory desk:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <a
            href="https://wa.me/919175177777?text=Hi%20Store4Riders%2C%20I%20need%20help%20choosing%20the%20right%20gear%20size"
            target="_blank"
            rel="noopener noreferrer"
            className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-950 text-sm group-hover:text-emerald-800 transition-colors">
                Instant WhatsApp Consultation
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Send us your height, weight, chest measurement, or head circumference for instant size recommendations.
              </p>
            </div>
          </a>

          <a
            href="tel:+919175177777"
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all flex items-start gap-3.5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <PhoneCall size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-brand transition-colors">
                Direct Phone Advisory
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Call +91 91751 77777 (Mon - Sat: 10AM - 7PM IST) to speak live with an equipment advisor.
              </p>
            </div>
          </a>
        </div>
      </section>
    </PolicyPageLayout>
  );
}
