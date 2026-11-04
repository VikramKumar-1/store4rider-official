import type { Metadata } from "next";
import { ErrorView } from "@/components/ui/ErrorView";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Store4Riders",
  description:
    "The page you are looking for took an off-road detour or no longer exists. Browse motorcycle helmets, riding gear, and accessories at Store4Riders.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return <ErrorView code={404} fullPage={true} />;
}
