import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Video, Compass, Award, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Collaboration & Creator Partnerships | Store4Riders",
  description:
    "Partner with Store4Riders. We collaborate with moto-vloggers, motorcycle touring creators, track racers, riding clubs, and gear brands.",
  alternates: {
    canonical: "https://store4riders.com/collaboration",
  },
};

export default function CollaborationPage() {
  return (
    <PolicyPageLayout
      title="Collaboration & Partnerships"
      subtitle="Join hands with India's premier motorcycle safety gear platform. We partner with passionate creators, riding clubs, expedition riders, and safety advocates."
      badge="Community & Alliances"
      badgeIcon={<HeartHandshake size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/collaboration"
      summaryAlert={{
        type: "brand",
        title: "Advocating Rider Safety Together",
        text: (
          <span>
            Are you a moto-vlogger, motorcycle touring enthusiast, or riding academy instructor? We are excited to collaborate with passionate voices committed to promoting certified safety gear and motorcycle culture across India.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Who We Collaborate With</h2>
        <p>
          At Store4Riders, we believe the motorcycling community grows strongest when riders support riders. We actively build relationships with:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <Video className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Moto-Vloggers &amp; Content Creators</h4>
              <p className="text-xs text-slate-600 mt-1">
                Creators producing authentic motorcycle reviews, touring vlogs, DIY maintenance tutorials, and track-day content on YouTube, Instagram, and podcasts.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <Compass className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Expedition &amp; Adventure Riders</h4>
              <p className="text-xs text-slate-600 mt-1">
                Motorcyclists undertaking challenging cross-country expeditions, high-altitude Himalayan tours, or world touring adventures.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <Award className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Riding Academies &amp; Trainers</h4>
              <p className="text-xs text-slate-600 mt-1">
                Certified off-road, adventure, or circuit track training schools instructing students on roadcraft, body positioning, and safety armor.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
            <HeartHandshake className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Motorcycle Clubs &amp; Touring Chapters</h4>
              <p className="text-xs text-slate-600 mt-1">
                Organized motorcycle riding clubs seeking group safety gear alliances, exclusive member privileges, and event co-sponsorships.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>2. Partnership Opportunities</h2>
        <p>
          We tailor each collaboration to maximize mutual community value and promote authentic gear awareness:
        </p>
        <ul>
          <li>
            <strong>Gear Review &amp; Long-Term Testing:</strong> Receive latest-generation helmets, jackets, boots, or luggage for rigorous real-world road and weather testing.
          </li>
          <li>
            <strong>Expedition Gear Support:</strong> Essential touring gear sponsorship for qualified cross-country and high-altitude Himalayan expeditions.
          </li>
          <li>
            <strong>Riding Club Privilege Programs:</strong> Dedicated club coupon codes and volume benefits for registered riding clubs and their verified members.
          </li>
          <li>
            <strong>Co-Branded Safety Workshops:</strong> Partnering with training institutes to conduct helmet fitment workshops, armor education, and emergency gear maintenance sessions.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. What We Look For in Partners</h2>
        <p>
          We prioritize authenticity, genuine community connection, and safety advocacy over superficial metrics:
        </p>
        <ul>
          <li><strong>Commitment to Full Gear:</strong> An active advocate for All The Gear, All The Time (ATGATT) in all published content.</li>
          <li><strong>Original, Engaging Content:</strong> Consistent, high-quality audio-visual storytelling and honest gear reviews.</li>
          <li><strong>Engaged Audience:</strong> An interactive, authentic motorcycle following based in India or touring South Asia.</li>
          <li><strong>Professionalism &amp; Reliability:</strong> Clear deliverables, agreed timelines, and transparent communication.</li>
        </ul>
      </section>

      <section>
        <h2>4. How to Submit a Collaboration Proposal</h2>
        <p>
          Ready to partner with Store4Riders? Send us a brief proposal detailing:
        </p>
        <ol>
          <li>Your name, social media profiles (YouTube channel URL, Instagram handle, blog), and audience demographics.</li>
          <li>Details of your motorcycle(s) and regular riding discipline (e.g., Adventure touring, Track racing, City commuting).</li>
          <li>A concise summary of your upcoming ride, expedition, or content series and proposed collaboration ideas.</li>
          <li>Any specific gear categories you are looking to review or put to the test.</li>
        </ol>

        <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white">Submit Your Proposal</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Email our brand partnerships desk directly at <strong>collab@store4riders.com</strong>
            </p>
          </div>
          <a
            href="mailto:collab@store4riders.com?subject=Collaboration%20Proposal%20-%20Store4Riders"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand/90 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-xs shrink-0"
          >
            <Mail size={14} />
            <span>Email Proposal</span>
          </a>
        </div>
      </section>
    </PolicyPageLayout>
  );
}
