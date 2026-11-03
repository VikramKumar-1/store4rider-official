import type { Metadata } from "next";
import { ReturnsReplacementsModule } from "@/modules/static-pages/components/ReturnsReplacementsModule";

export const metadata: Metadata = {
  title: "Exchange & Replacements Policy | Store4Riders",
  description:
    "Official Store4Riders exchange and replacement policy. Wrong size, wrong colour - no problem. Learn about our replacement process and guidelines.",
  alternates: {
    canonical: "https://www.store4riders.com/returns-replacements-store4riders/",
  },
};

export default function ReturnsReplacementsPage() {
  return <ReturnsReplacementsModule />;
}
