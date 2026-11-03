import type { Metadata } from "next";
import { GooglePayPhonePeModule } from "@/modules/static-pages/components/GooglePayPhonePeModule";

export const metadata: Metadata = {
  title: "Gpay/Phone Pay | Store4Riders",
  description:
    "Official GooglePay or PhonePay number, UPI ID, and Axis Bank transfer details for Store4Riders (Motohive Media Pvt. Ltd.) in Pune.",
  alternates: {
    canonical: "https://www.store4riders.com/googlepay-phonepay",
  },
};

export default function GooglePayPhonePayPage() {
  return <GooglePayPhonePeModule />;
}
