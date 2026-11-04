import type { Metadata } from "next";
import { ErrorView } from "@/components/ui/ErrorView";

export const metadata: Metadata = {
  title: "403 - Access Forbidden | Store4Riders",
  description: "You do not have permission to access this trail or page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForbiddenPage() {
  return <ErrorView code={403} fullPage={true} />;
}
