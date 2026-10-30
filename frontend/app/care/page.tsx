import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, ShieldCheck, Sparkles, AlertTriangle, Droplets, Wind, Sun } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Motorcycle Gear Care & Maintenance Guide | Store4Riders",
  description:
    "Learn how to properly clean, maintain, wash, and store your motorcycle helmets, leather suits, textile jackets, boots, and riding gloves to maximize lifespan and safety.",
  alternates: {
    canonical: "https://store4riders.com/care",
  },
};

export default function CarePage() {
  return (
    <PolicyPageLayout
      title="Gear Care & Maintenance Guide"
      subtitle="Extend the lifespan, comfort, and protective integrity of your motorcycle helmets, armored jackets, boots, and gloves with professional care advice."
      badge="Maintenance Guide"
      badgeIcon={<Wrench size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/care"
      summaryAlert={{
        type: "info",
        title: "Maintain Certified Protection",
        text: (
          <span>
            Regular maintenance ensures your safety equipment performs at its peak. Using harsh chemical detergents, washing armor in machines, or improper storage can degrade protective EPS liners and compromise impact resistance.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Motorcycle Helmet Care &amp; Cleaning</h2>
        <p>
          Your helmet is your most critical piece of safety equipment. Proper maintenance keeps it hygienic, odor-free, and optically clear:
        </p>

        <div className="space-y-4 my-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Droplets size={16} className="text-brand" />
              <span>Removable Comfort Liner &amp; Cheek Pads</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Carefully unclip the cheek pads and crown liner. Hand-wash in lukewarm water using a mild baby shampoo or specialized helmet cleaner. Never use harsh chemical laundry detergents or bleach. Squeeze gently without wringing, and allow to air-dry completely in a shaded, well-ventilated space. Never tumble dry.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles size={16} className="text-brand" />
              <span>Visor &amp; Pinlock Anti-Fog Lens Cleaning</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Remove the visor from the helmet ratchet base plates. Soak a clean, soft microfiber cloth in warm water and drape it over the visor for 2 minutes to soften dried insect residue. Wipe gently from center to edges. Never use glass cleaners (like Colin), ammonia sprays, or abrasive paper towels which strip scratch-resistant and UV coatings.
            </p>
            <p className="text-xs text-amber-700 font-medium mt-2">
              *Pinlock Warning: If cleaning a Pinlock insert, rinse only with lukewarm water and let it air-dry. Never rub the soft silicone anti-fog gasket with rough towels.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <span>Never Hang Your Helmet on Bike Mirrors!</span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Hanging a helmet over your motorcycle rearview mirror concentrates motorcycle vibrations and the narrow mirror stem onto one specific point of the internal Expanded Polystyrene (EPS) foam liner, creating a localized dent and destroying critical impact absorption capacity. Always rest your helmet on a flat surface or secure helmet hook.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>2. Textile Riding Jackets &amp; Pants</h2>
        <p>
          Cordura, high-denier polyester, and mesh riding jackets require specific washing techniques to preserve seam sealing and waterproof membranes:
        </p>
        <ol>
          <li>
            <strong>Remove All CE Armor First:</strong> Before washing, always unfasten the velcro pockets and remove shoulder, elbow, chest, and back protectors. Armor inserts should only be wiped down with a damp cloth.
          </li>
          <li>
            <strong>Detach Thermal &amp; Rain Liners:</strong> Wash liners separately according to their individual care tags.
          </li>
          <li>
            <strong>Close All Zippers and Velcro Tabs:</strong> Secure main zippers, pocket zips, and cuff velcro strips so they do not snag against mesh fabrics during washing.
          </li>
          <li>
            <strong>Use Mild Technical Wash:</strong> Use a gentle liquid technical gear wash (or mild detergent). <strong>Never use fabric softeners</strong>—softening agents coat breathable microporous waterproof membranes (like Gore-Tex or Reissa) and permanently ruin their breathability.
          </li>
          <li>
            <strong>Hang Dry in Shade:</strong> Hang the garment on a broad, sturdy hanger in a breezy, shaded location away from direct harsh sun rays.
          </li>
        </ol>
      </section>

      <section>
        <h2>3. Leather Suits, Jackets &amp; Gloves</h2>
        <p>
          Full-grain leather is a natural, durable material that requires hydration to prevent drying out and cracking:
        </p>
        <ul>
          <li>
            <strong>After Every Long Ride:</strong> Wipe away bug splatters and road dirt immediately using a soft microfiber cloth dipped in clean lukewarm water.
          </li>
          <li>
            <strong>Conditioning:</strong> Every 3 to 6 months, apply a specialized, neutral motorcycle leather conditioner or balm with a sponge. This restores natural oils lost to highway wind and heat.
          </li>
          <li>
            <strong>Drying Wet Leather:</strong> If caught in a downpour, never dry leather gear near radiators, room heaters, or under direct blazing sunlight. Let it dry naturally on a wide contoured hanger at room temperature.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Riding Boots &amp; Footwear</h2>
        <ul>
          <li>
            <strong>Mud &amp; Chain Grime Removal:</strong> Use a soft-bristle nylon brush and lukewarm water to remove caked mud, grit, and road salt from sole grooves and buckle pivots.
          </li>
          <li>
            <strong>Buckles &amp; Zippers:</strong> Lubricate stiff boot zippers and ratchet buckle springs periodically with a dry silicone spray or beeswax.
          </li>
          <li>
            <strong>Odor Control:</strong> Remove inner insoles after rides and insert cedar shoe trees or silica packs to absorb perspiration moisture.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Storage Best Practices</h2>
        <p>
          When parking your gear between rides, store everything in a cool, dry, well-ventilated closet away from direct sunlight. Never store riding gear in air-tight plastic bags, damp basements, or near gasoline cans and engine exhaust fumes, as volatile petroleum vapors can degrade internal helmet adhesives and EPS foam densities.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
