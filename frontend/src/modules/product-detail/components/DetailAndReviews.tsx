"use client";

import React from "react";
import { ReviewData } from "../types/product-detail.types";

/* ─── SVG Icon Components ─── */
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);
const DropletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>
);
const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
);
const AwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
);
const LayersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
  ><path d="m6 9 6 6 6-6" /></svg>
);
const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 9H12"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
);

/* ─── Icon Mapping ─── */
const SECTION_ICON_MAP: Record<string, React.ReactNode> = {
  material: <WrenchIcon />, construction: <WrenchIcon />,
  protection: <ShieldIcon />, water: <DropletIcon />, waterproof: <DropletIcon />,
  safety: <EyeIcon />, convenience: <EyeIcon />,
  comfort: <HeartIcon />, fit: <HeartIcon />,
  damage: <AwardIcon />, warranty: <AwardIcon />, accidental: <AwardIcon />,
  feature: <LayersIcon />,
};

const getIconForTitle = (title: string): React.ReactNode => {
  const lower = title.toLowerCase();
  for (const [keyword, icon] of Object.entries(SECTION_ICON_MAP)) {
    if (lower.includes(keyword)) return icon;
  }
  return <LayersIcon />;
};

/* ─── HTML Parser ─── */
interface DescriptionSection {
  title: string;
  htmlContent: string;
  icon: React.ReactNode;
}

const parseDescriptionToSections = (html: string): { intro: string; sections: DescriptionSection[] } => {
  if (!html) return { intro: "", sections: [] };
  const parts = html.split(/<p>\s*<strong>([^<]+)<\/strong>\s*<\/p>/gi);
  if (parts.length <= 1) return { intro: html, sections: [] };

  const intro = parts[0] || "";
  const sections: DescriptionSection[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim();
    const content = parts[i + 1]?.trim();
    if (title) {
      sections.push({ title, htmlContent: content || "", icon: getIconForTitle(title) });
    }
  }
  return { intro, sections };
};

/**
 * DetailAndReviews Component
 *
 * Matches client mockup structure (brand bar + 2-column)
 * with premium UI (accordions, icons, review cards).
 */
export const DetailAndReviews: React.FC<{ fullDescription: string; reviews: ReviewData[] }> = ({ fullDescription, reviews }) => {
  const [openSections, setOpenSections] = React.useState<Set<number>>(new Set([0]));
  const [showAllReviews, setShowAllReviews] = React.useState(false);

  const parsedDescription = fullDescription
    ? fullDescription.replace(
        /\{\{media\s+url="([^"]+)"\}\}/g,
        (_match, p1) => `https://store4riders.s3.ap-south-2.amazonaws.com/${encodeURI(p1.trim())}`
      )
    : "";

  const { intro, sections } = parseDescriptionToSections(parsedDescription);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="w-full mt-10 md:mt-14">

      {/* ── Full-width Brand Bar — Desktop Only (2 columns visible) ── */}
      <div className="hidden lg:block w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 py-3.5 px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-[1fr_1fr] gap-4">
          <h2 className="font-sans text-base font-bold uppercase tracking-[0.2em] text-white flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#ab1509]" />
            Product Details
          </h2>
          <h2 className="font-sans text-base font-bold uppercase tracking-[0.2em] text-white flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#ab1509]" />
            Customer Reviews
          </h2>
        </div>
      </div>

      {/* ── 2-Column Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pt-8 md:pt-10 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-10 lg:gap-14">

          {/* ─── LEFT: Product Details (Accordion) ─── */}
          <div>
            {/* Mobile section heading */}
            <div className="lg:hidden w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 py-3 px-4 -mx-4 mb-6 rounded-sm">
              <h2 className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-white flex items-center gap-2">
                <span className="w-5 h-[2px] bg-[#ab1509]" />
                Product Details
              </h2>
            </div>
            {intro && (
              <div
                className="magento-layout text-neutral-700 text-[15px] leading-relaxed border-l-[3px] border-[#ab1509] pl-4 py-1.5 mb-6"
                dangerouslySetInnerHTML={{ __html: intro }}
              />
            )}

            {/* Accordion Sections */}
            {sections.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {sections.map((section, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                      openSections.has(idx) ? "border-neutral-300 shadow-sm bg-white" : "border-neutral-200 bg-neutral-50/60 hover:border-neutral-300"
                    }`}
                  >
                    <button
                      onClick={() => toggleSection(idx)}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left"
                    >
                      <span className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                        openSections.has(idx) ? "bg-[#ab1509]/10 text-[#ab1509]" : "bg-neutral-100 text-neutral-500"
                      }`}>
                        {section.icon}
                      </span>
                      <span className="flex-1 font-semibold text-neutral-900 text-[14px]">{section.title}</span>
                      <span className={openSections.has(idx) ? "text-[#ab1509]" : "text-neutral-400"}>
                        <ChevronIcon open={openSections.has(idx)} />
                      </span>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openSections.has(idx) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    }`}>
                      <div className="px-4 pb-4 pl-[3.5rem]">
                        <div
                          className="magento-layout-accordion text-neutral-600 text-[14px] leading-[1.75]"
                          dangerouslySetInnerHTML={{ __html: section.htmlContent }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="magento-layout"
                dangerouslySetInnerHTML={{ __html: parsedDescription || "<p class='text-neutral-400 italic'>No description available.</p>" }}
              />
            )}
            
            {/* ── Trust Badges (Moved here to balance columns) ── */}
            <div className="mt-8 bg-neutral-50 border border-neutral-200 rounded-lg p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Why Store4Riders?</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: <ShieldIcon />, title: "CE Certified Safety", desc: "International safety standards" },
                  { icon: <AwardIcon />, title: "1 Year Damage Cover", desc: "Free replacement on accidents" },
                  { icon: <TruckIcon />, title: "Fast & Free Shipping", desc: "Across India, no hidden charges" },
                  { icon: <DropletIcon />, title: "100% Genuine Products", desc: "Authentic gear, zero knockoffs" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[#ab1509] flex-shrink-0 p-1.5 bg-[#ab1509]/5 rounded-md mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 leading-tight">{item.title}</p>
                      <p className="text-xs text-neutral-400 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ─── RIGHT: Reviews + Trust Badges ─── */}
          <div className="flex flex-col gap-5">

            {/* Rating Summary Card */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-neutral-900">{reviews?.length > 0 ? "4.9" : "–"}</p>
                  <div className="flex text-amber-400 mt-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                        fill={reviews?.length > 0 ? "currentColor" : "none"}
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{reviews?.length || 0} reviews</p>
                </div>
                <div className="flex-1 space-y-1.5 pl-4 border-l border-neutral-100">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviews?.filter(r => Math.floor(r.rating) === star).length || 0;
                    const percent = reviews?.length ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-neutral-500 w-3">{star}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" className="text-amber-400 flex-shrink-0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="text-xs text-neutral-400 w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {reviews && reviews.length > 0 ? (
              <>
                {reviews.slice(0, showAllReviews ? reviews.length : 3).map((review) => (
                  <div key={review.id} className="border border-neutral-200 rounded-lg p-5 hover:shadow-sm transition-shadow bg-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[#ab1509] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {review.author.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm truncate">{review.author}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                                fill={i < Math.floor(review.rating) ? "currentColor" : "none"}
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            ))}
                          </div>
                          <span className="text-xs text-neutral-400 ml-1.5">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-neutral-600 text-sm leading-relaxed pl-12">{review.text}</p>
                  </div>
                ))}

                {reviews.length > 3 && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="w-full py-2.5 text-sm font-semibold text-[#ab1509] hover:text-[#8b1007] transition-colors flex items-center justify-center gap-1.5"
                  >
                    {showAllReviews ? "Show Less" : `View All ${reviews.length} Reviews`}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`transition-transform duration-300 ${showAllReviews ? "rotate-180" : ""}`}
                    ><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                )}
              </>
            ) : (
              <div className="border border-neutral-200 rounded-lg p-8 text-center bg-white">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <p className="text-neutral-700 font-semibold">No reviews yet</p>
                <p className="text-neutral-400 text-sm mt-1 max-w-[250px] mx-auto">Be the first rider to review this product and help others make the right choice.</p>
              </div>
            )}

            {/* Write a Review CTA */}
            <button className="w-full py-3 border-2 border-neutral-900 rounded-lg text-sm font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-200">
              Write a Review
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};
