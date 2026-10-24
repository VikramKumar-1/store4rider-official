import type { Metadata } from "next";
import { ContactPageModule } from "@/modules/contact/components/ContactPageModule";

export const metadata: Metadata = {
  title: "Contact Us | Store4Riders",
  description: "Contact Store4Riders customer care for questions on orders, riding gear, helmet fitment, and exchange requests.",
};

export default function ContactPage() {
  return <ContactPageModule />;
}
