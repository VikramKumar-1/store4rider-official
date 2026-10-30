import type { Metadata } from "next";
import Link from "next/link";
import { Info, ShieldCheck, Award, HeartHandshake, Compass, Users, CheckCircle2 } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "About Store4Riders | India's Premier Riding Gear Destination",
  description:
    "Learn about Store4Riders, operated by MotoHive Media in Pune. Discover our story, our passion for motorcycle safety, and our curated collection of certified riding gear.",
  alternates: {
    canonical: "https://store4riders.com/about-us",
  },
};

export default function AboutUsPage() {
  return (
    <PolicyPageLayout
      title="About Store4Riders"
      subtitle="Built by riders, for riders. We are on a mission to make certified motorcycle safety gear accessible to every motorcyclist in India."
      badge="Our Story & Mission"
      badgeIcon={<Info size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/about-us"
      summaryAlert={{
        type: "brand",
        title: "Passionate About Rider Safety",
        text: (
          <span>
            Every helmet, armored jacket, pair of boots, and accessory listed on Store4Riders is selected, tested, and reviewed with one non-negotiable benchmark: uncompromising rider safety on Indian roads and highways.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. The Store4Riders Story</h2>
        <p>
          Store4Riders was born on the highway. Founded by a dedicated collective of long-distance tourers, track enthusiasts, and automotive journalists, we experienced firsthand the challenge of finding genuine, certified motorcycle riding gear in India.
        </p>
        <p>
          Too often, riders were forced to choose between overpriced gray-market imports with uncertain provenance, or substandard replica helmets that failed the most basic crash safety certifications.
        </p>
        <p>
          We created <strong>Store4Riders</strong> (operated by <strong>MotoHive Media Pvt. Ltd.</strong> in Pune, Maharashtra) to bridge that divide—providing Indian motorcyclists with a transparent, trusted, and authorized online destination for global motorcycle safety gear backed by official manufacturer warranties, verified sizing guides, and dedicated after-sales support.
        </p>
      </section>

      <section>
        <h2>2. Our Core Pillars</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">100% Certified Authenticity</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              We partner directly with authorized brand distributors. Zero gray-market stock, zero replicas. Every helmet meets ECE 22.06, DOT, or ISI standards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <Compass size={20} />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Real Rider Consultation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our support team consists of active motorcyclists. We help you choose the right gear for your riding discipline—whether touring Ladakh or weekend track days.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <HeartHandshake size={20} />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">7-Day Fit Guarantee</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Riding safety requires a snug, accurate fit. Our hassle-free 7-day size exchange ensures your armor and helmet fit securely without compromise.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>3. What We Offer</h2>
        <p>
          Our catalog spans every essential piece of protective and touring equipment:
        </p>
        <ul>
          <li>
            <strong>Certified Helmets:</strong> Full-face, modular, adventure dual-sport, and motocross helmets with pinlock anti-fog visors and ECE 22.06 certifications.
          </li>
          <li>
            <strong>Armored Apparel:</strong> All-weather textile touring jackets, mesh commuter jackets, CE Level 2 armor inserts, Kevlar riding jeans, and armored leather suits.
          </li>
          <li>
            <strong>Riding Boots & Footwear:</strong> Waterproof touring boots, ankle protective riding sneakers, and track-ready racing boots with heel/shin reinforcement.
          </li>
          <li>
            <strong>Riding Gloves:</strong> Full-gauntlet track gloves, short cuff mesh gloves, and waterproof thermal winter gloves with Knox SPS or carbon-fiber scaphoid protectors.
          </li>
          <li>
            <strong>Luggage & Touring Accessories:</strong> Heavy-duty magnetic tank bags, dry duffels, tail bags, saddlebags, and Bluetooth intercom communication systems.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Our Logistics & Experience Center</h2>
        <p>
          Headquartered in the vibrant motorcycling capital of <strong>Pune, Maharashtra</strong>, our central warehouse coordinates rapid dispatch across 19,000+ Indian pincodes. Our fulfillment facility features specialized helmet storage environments to preserve adhesive linings, visor coatings, and protective EPS densities in optimal condition.
        </p>
      </section>

      <section>
        <h2>5. Join the Store4Riders Community</h2>
        <p>
          Whether you are embarking on your very first cross-country motorcycle trip or upgrading your daily commuter armor, Store4Riders is proud to ride alongside you.
        </p>
        <div className="pt-4 flex flex-wrap gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-all shadow-xs"
          >
            <span>Explore All Riding Gear</span>
          </Link>
          <Link
            href="/rider-assist"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-xl transition-all"
          >
            <span>Consult Rider Assist</span>
          </Link>
        </div>
      </section>
    </PolicyPageLayout>
  );
}
