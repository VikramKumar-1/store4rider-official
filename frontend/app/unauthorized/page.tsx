import type { Metadata } from "next";
import { ErrorView } from "@/components/ui/ErrorView";

export const metadata: Metadata = {
  title: "401 - Authorisation Required | Store4Riders",
  description: "Please sign in to access your Store4Riders rider account and garage.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnauthorizedPage() {
  return <ErrorView code={401} fullPage={true} />;
}
