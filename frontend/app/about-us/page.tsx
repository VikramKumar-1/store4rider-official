import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us | Store4Riders",
  description: "Learn about Store4Riders, your trusted destination for motorcycle helmets, riding gear, and accessories in India.",
};

export default function AboutUsPage() {
  return (
    <div className="min-h-[70vh] bg-neutral-950 text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-neutral-800 pb-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">About Us</h1>
          <p className="text-neutral-400 mt-2 text-base md:text-lg">One stop shop solution for all your riding needs.</p>
        </div>
        <div className="space-y-6 text-neutral-300 leading-relaxed text-base">
          <p>
            Store4Riders is an initiative by passionate riders to bring the world’s best riding gear, helmets, and motorcycle accessories to motorcyclists across India.
          </p>
          <p>
            From premier helmets to certified armored jackets, waterproof touring luggage, gloves, and protective boots, we test, review, and curate gear that meets rigorous global safety certifications like ECE 22.06, DOT, and CE Level 2.
          </p>
          <p>
            Operated by MotoHive Media Pvt. Ltd. based in Pune, Maharashtra, we are committed to providing authentic gear, prompt support, and transparent policies to fellow riders.
          </p>
        </div>
        <div className="pt-6">
          <Link href="/" className="inline-block bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-3 rounded-md transition-all">
            Explore All Gear
          </Link>
        </div>
      </div>
    </div>
  );
}
