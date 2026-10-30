import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Collaboration & Partnerships | Store4Riders",
  description: "Partner with Store4Riders for rider collaborations, event sponsorships, and brand alliances.",
};

export default function CollaborationPage() {
  return (
    <div className="min-h-[70vh] bg-neutral-950 text-white pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="border-b border-neutral-800 pb-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Collaboration</h1>
          <p className="text-neutral-400 mt-2 text-base md:text-lg">Work with Store4Riders.</p>
        </div>
        <div className="space-y-6 text-neutral-300 leading-relaxed text-base">
          <p>
            Are you a moto-vlogger, content creator, riding club organizer, or brand? We are always excited to collaborate with passionate motorcyclists and automotive communities.
          </p>
          <p>
            Reach out to us at <span className="text-brand font-medium">contact@store4riders.com</span> with details about your proposal, audience, or event.
          </p>
        </div>
        <div className="pt-6">
          <Link href="/contact-us" className="inline-block bg-brand hover:bg-brand/90 text-white font-semibold px-6 py-3 rounded-md transition-all">
            Contact Our Team
          </Link>
        </div>
      </div>
    </div>
  );
}
