import type { Metadata } from "next";
import { ContactPageModule } from "@/modules/contact/components/ContactPageModule";

export const metadata: Metadata = {
  title: "Customer Support & Contact Us | Store4Riders",
  description: "Get immediate assistance with your riding gear orders, delivery tracking, payment queries, exchanges, and sizing advice.",
};

export default function SupportPage() {
  return <ContactPageModule />;
}
