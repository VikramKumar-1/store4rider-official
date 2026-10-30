import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ShieldAlert } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Conditions of Sale & Use | Store4Riders",
  description:
    "Read the terms, conditions of sale, acceptable use guidelines, and purchasing policies for Store4Riders motorcycle gear.",
  alternates: {
    canonical: "https://store4riders.com/terms",
  },
};

export default function TermsPage() {
  return (
    <PolicyPageLayout
      title="Conditions of Sale & Use"
      subtitle="Please review these terms and conditions carefully before accessing our store or purchasing certified motorcycle riding gear, helmets, and accessories."
      badge="Legal & Terms"
      badgeIcon={<FileText size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/terms"
      summaryAlert={{
        type: "brand",
        title: "Agreement to Terms",
        text: (
          <span>
            By browsing, creating an account, or placing an order on Store4Riders, you confirm that you have read, understood, and agreed to be bound by these Conditions of Sale & Use and our applicable store policies.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. About Store4Riders and the Operator</h2>
        <p>
          The website <strong>www.store4riders.com</strong>, including all mobile-optimized interfaces and related application services, is owned and operated by <strong>MotoHive Media Pvt. Ltd.</strong>, a private limited company incorporated under the Companies Act of India, with its corporate registered office located in Pune, Maharashtra, India.
        </p>
        <p>
          Throughout these Conditions of Sale & Use, the terms &ldquo;Store4Riders&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, and &ldquo;our&rdquo; refer to MotoHive Media Pvt. Ltd. The terms &ldquo;you&rdquo;, &ldquo;user&rdquo;, &ldquo;customer&rdquo;, or &ldquo;rider&rdquo; refer to any individual or business entity accessing our platform or purchasing riding gear.
        </p>
      </section>

      <section>
        <h2>2. Eligibility and Account Security</h2>
        <p>
          To purchase products or create a customer profile on Store4Riders, you must be at least 18 years of age and legally competent to enter into a binding contract under the Indian Contract Act, 1872. Minors may use our website only under the supervision and consent of a parent or legal guardian.
        </p>
        <ul>
          <li>
            You are responsible for maintaining the confidentiality of your account credentials, login passwords, and OTP tokens.
          </li>
          <li>
            You agree to accept responsibility for all activities and orders placed under your authenticated account.
          </li>
          <li>
            Store4Riders reserves the right to suspend or terminate accounts, cancel unverified orders, or refuse service if fraudulent activity or misrepresentation is detected.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Product Information, Sizing, and Fitment</h2>
        <p>
          We take meticulous care to ensure that product photographs, specifications, CE armor certifications, weight, and sizing charts are accurate. However, slight variations in color tone may occur due to display monitor calibrations, photography lighting, and batch manufacturing.
        </p>
        <p>
          Motorcycle riding gear, particularly full-face helmets, armored jackets, riding pants, and protective boots, requires precise fitment to provide certified impact protection. We provide detailed sizing charts on every product page. Customers are strongly encouraged to consult our sizing guides or reach out to our <strong>Rider Assist</strong> team before completing their purchase.
        </p>
      </section>

      <section>
        <h2>4. Pricing, Taxes, and GST Billing</h2>
        <p>
          All product prices displayed on Store4Riders are quoted in Indian Rupees (₹ / INR). Unless explicitly stated otherwise, retail prices are inclusive of all applicable statutory Goods and Services Tax (GST) under Indian taxation laws.
        </p>
        <ul>
          <li>
            We provide valid GST tax invoices with every dispatched order. Registered business entities may input their 15-digit GSTIN during checkout to claim legitimate Input Tax Credit (ITC).
          </li>
          <li>
            Prices and promotional discount coupons are subject to change without prior notice. The price charged for an order will be the price displayed at the exact time the order is finalized.
          </li>
          <li>
            In the rare event of a technical pricing error or typographical discrepancy, Store4Riders reserves the right to cancel the order and provide a full refund or store credit before shipment.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Orders, Payment Processing, and Security</h2>
        <p>
          Placing an order constitutes an offer to purchase. An order is confirmed only upon successful payment verification and issuance of an official order confirmation notification via email and SMS.
        </p>
        <p>
          We partner with leading Reserve Bank of India (RBI) authorized payment gateways including PayU, CCavenue, and Snapmint Cardless EMI. We support:
        </p>
        <ul>
          <li>UPI (Google Pay, PhonePe, Paytm, BHIM)</li>
          <li>Major Credit Cards and Debit Cards (Visa, MasterCard, RuPay, American Express)</li>
          <li>Net Banking across 50+ Indian commercial banks</li>
          <li>Cardless and No-Cost EMI plans via Snapmint</li>
          <li>Cash on Delivery (COD) for eligible pincodes with verification</li>
        </ul>
        <p>
          Store4Riders does not store your credit/debit card numbers, CVVs, or Net Banking PINs on our servers. All financial transactions are processed through bank-grade 256-bit SSL encrypted channels adhering to PCI-DSS Level 1 compliance.
        </p>
      </section>

      <section>
        <h2>6. Shipping, Title, and Risk of Loss</h2>
        <p>
          All purchases made from Store4Riders are delivered pursuant to a shipment contract with recognized third-party express couriers (e.g., Delhivery, BlueDart, DTDC). Title and risk of loss for products pass to you upon delivery by the carrier at the designated shipping address.
        </p>
        <p>
          Customers must inspect the outer shipping package before providing an OTP or signing the delivery receipt. If the outer carton is noticeably torn, tampered with, or open, refuse delivery or immediately record an unboxing video to facilitate rapid resolution.
        </p>
      </section>

      <section>
        <h2>7. Exchange and Replacement Policy</h2>
        <p>
          To ensure every rider gets the right protective fit, Store4Riders provides a dedicated <strong>7-Day Size and Gear Exchange Policy</strong> for eligible riding jackets, helmets, pants, boots, and gloves from the date of confirmed delivery.
        </p>
        <blockquote>
          <strong>Important Note:</strong> Store4Riders operates on an exchange and replacement model. We do not provide monetary cash refunds for non-defective merchandise. In the event that your requested replacement size or color variant is out of stock, store credit with lifetime validity will be credited to your account.
        </blockquote>
        <p>
          For full conditions, qualified product categories, and reverse pickup instructions, please refer to our dedicated{" "}
          <Link href="/returns" className="text-brand hover:underline font-bold">
            Exchange Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2>8. Safety Warning and Limitation of Liability</h2>
        <p>
          Motorcycling, touring, track racing, and off-road riding are inherently dangerous activities involving inherent physical risks of severe injury or fatality. While the certified safety helmets, armor, boots, and protective clothing sold by Store4Riders meet stringent international safety standards (e.g., ECE 22.06, DOT FMVSS 218, CE Level 2), <strong>no piece of protective gear can guarantee complete protection against all impacts, accidents, or collisions</strong>.
        </p>
        <p>
          Under no circumstances shall MotoHive Media Pvt. Ltd., its directors, employees, or partners be liable for any indirect, incidental, punitive, or consequential damages resulting from the use or misuse of any product purchased through this website.
        </p>
      </section>

      <section>
        <h2>9. Intellectual Property</h2>
        <p>
          All content included on this website—including brand logos, product descriptions, interface designs, banners, graphics, icons, digital downloads, and software code—is the property of MotoHive Media Pvt. Ltd. or its licensed product manufacturers and is protected under Indian and international copyright and trademark legislation.
        </p>
      </section>

      <section>
        <h2>10. Governing Law and Jurisdiction</h2>
        <p>
          These Conditions of Sale & Use, together with all related policies and transactions conducted on Store4Riders, shall be governed by, construed, and enforced exclusively in accordance with the laws of the Republic of India. Any legal dispute, claim, or controversy arising out of or relating to these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Pune, Maharashtra, India</strong>.
        </p>
      </section>

      <section>
        <h2>11. Contact Information</h2>
        <p>
          If you have questions, notices, or grievances regarding these Conditions of Sale & Use, please reach out to our legal and customer support desk at:
        </p>
        <ul>
          <li><strong>Entity:</strong> MotoHive Media Pvt. Ltd. (Store4Riders)</li>
          <li><strong>Email:</strong> legal@store4riders.com / contact@store4riders.com</li>
          <li><strong>Support Helpline:</strong> +91 91751 77777 (Mon - Sat, 10:00 AM - 7:00 PM IST)</li>
          <li><strong>Address:</strong> Pune, Maharashtra, 411001, India</li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
