import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Privacy and Cookie Policy | Store4Riders",
  description:
    "Learn how Store4Riders collects, secures, manages, and safeguards your personal data, order records, and privacy.",
  alternates: {
    canonical: "https://store4riders.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <PolicyPageLayout
      title="Privacy and Cookie Policy"
      subtitle="Your privacy is paramount. Discover how Store4Riders collects, uses, and safeguards your personal and transaction information."
      badge="Privacy & Security"
      badgeIcon={<Lock size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/privacy"
      summaryAlert={{
        type: "success",
        title: "Zero Card Storage Guarantee",
        text: (
          <span>
            Store4Riders does not store your credit card, debit card numbers, CVVs, or Net Banking credentials on our servers. All financial transactions are processed securely via RBI-licensed, PCI-DSS Level 1 compliant payment gateways.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Introduction and Commitment</h2>
        <p>
          Store4Riders (operated by <strong>MotoHive Media Pvt. Ltd.</strong>) is firmly committed to protecting the privacy, confidentiality, and security of our customers and site visitors. This Privacy and Cookie Policy explains our transparent practices regarding the collection, handling, storage, and protection of your personal information when you access our e-commerce platform.
        </p>
        <p>
          This policy complies with the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act (DPDP Act), 2023 of India.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>
          When you browse, register, or place an order on Store4Riders, we may collect the following categories of information:
        </p>
        <ul>
          <li>
            <strong>Contact & Profile Information:</strong> Your full name, email address, mobile phone number, and account password.
          </li>
          <li>
            <strong>Delivery & Billing Addresses:</strong> Street address, landmark, city, state, postal pincode, and recipient contact number for dispatching gear.
          </li>
          <li>
            <strong>Rider Fitment Details:</strong> Head circumference, chest measurements, shoe sizes, or motorcycle model preferences provided voluntarily to facilitate accurate sizing advice.
          </li>
          <li>
            <strong>Transaction Records:</strong> Order identification numbers, purchased items, date and time of order, payment gateway reference IDs, invoice totals, and GSTIN (for B2B tax invoicing).
          </li>
          <li>
            <strong>Technical & Device Data:</strong> IP address, browser type, operating system version, device identifiers, and pages visited via server log files.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>
          We use the information collected solely for legitimate commercial, operational, and customer support purposes, including:
        </p>
        <ul>
          <li>Processing, confirming, packaging, and delivering your motorcycle riding gear orders.</li>
          <li>Sending critical transactional alerts, shipment tracking links, and delivery status notifications via SMS, email, and WhatsApp.</li>
          <li>Facilitating seamless 7-day size exchanges, warranty claims, and customer service inquiries.</li>
          <li>Preventing fraudulent transactions, verifying Cash on Delivery orders, and mitigating security threats.</li>
          <li>Complying with statutory accounting, GST reporting, and tax audit obligations under Indian law.</li>
          <li>Sending promotional newsletters and new gear arrival updates only when you have explicitly opted in (with one-click unsubscribe options).</li>
        </ul>
      </section>

      <section>
        <h2>4. Payment Security & RBI Compliance</h2>
        <p>
          All electronic payment processing on Store4Riders is handled by Reserve Bank of India (RBI) authorized payment aggregators including PayU, CCavenue, and Snapmint.
        </p>
        <p>
          Our checkout flow uses TLS 1.3 / SSL encryption with 256-bit certificates. When you pay by credit card or debit card, the transaction is processed using secure tokenization and two-factor authentication (OTP) in direct communication with your issuing bank. Store4Riders never has access to, nor retains, your sensitive financial credentials.
        </p>
      </section>

      <section>
        <h2>5. Cookies and Web Storage</h2>
        <p>
          Cookies are small text files stored on your browser to enhance website functionality, maintain your shopping session, and provide a personalized experience.
        </p>
        <div className="overflow-x-auto my-4">
          <table className="w-full">
            <thead>
              <tr>
                <th>Cookie Type</th>
                <th>Purpose</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Essential / Session</strong></td>
                <td>Preserves your shopping cart items, authentication session, and CSRF security tokens.</td>
                <td>Session / 7 Days</td>
              </tr>
              <tr>
                <td><strong>Preference Cookies</strong></td>
                <td>Remembers your selected delivery pincode, currency, and display settings.</td>
                <td>30 Days</td>
              </tr>
              <tr>
                <td><strong>Analytics Cookies</strong></td>
                <td>Collects anonymized aggregate traffic metrics to optimize site performance and page speeds.</td>
                <td>12 Months</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          You can configure your browser settings to reject cookies or alert you when cookies are being sent. Note that disabling essential cookies may impact checkout functionality.
        </p>
      </section>

      <section>
        <h2>6. Third-Party Sharing and Disclosures</h2>
        <p>
          Store4Riders does not sell, rent, trade, or monetize your personal information to third-party marketing brokers. We share data strictly with trusted service partners required to complete your order:
        </p>
        <ul>
          <li>
            <strong>Logistics & Courier Partners:</strong> Third-party couriers (Delhivery, BlueDart, DTDC) receive your name, delivery address, pincode, and phone number solely for parcel delivery.
          </li>
          <li>
            <strong>Payment Aggregators:</strong> Transaction amounts and masked tokens are shared with payment gateways to process charges.
          </li>
          <li>
            <strong>Statutory & Legal Requirements:</strong> We may disclose information if required by court order, law enforcement summons, or regulatory authorities under applicable Indian laws.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Data Retention and Security Safeguards</h2>
        <p>
          We implement industry-standard administrative, physical, and technological security controls to safeguard your data against unauthorized access, loss, or misuse. Our database infrastructure is hosted in secure, ISO 27001 certified cloud data centers equipped with automated firewalls, continuous vulnerability monitoring, and encrypted backups.
        </p>
        <p>
          We retain your order and transactional information for the period required to fulfill statutory tax, warranty, and accounting obligations (typically 8 financial years under Indian taxation laws).
        </p>
      </section>

      <section>
        <h2>8. Your Rights and Preferences</h2>
        <p>As a valued rider and customer, you hold rights regarding your personal information:</p>
        <ul>
          <li>You may review, update, or correct your address and account details at any time via <strong>My Account</strong>.</li>
          <li>You may unsubscribe from marketing newsletters at any time by clicking the &ldquo;Unsubscribe&rdquo; link in any promotional email.</li>
          <li>You may request account deletion or data portability by contacting our Data Grievance Officer.</li>
        </ul>
      </section>

      <section>
        <h2>9. Grievance Officer Details</h2>
        <p>
          In accordance with the Information Technology Act, 2000 and rules made thereunder, the contact details of the Grievance Redressal Officer for Store4Riders are:
        </p>
        <ul>
          <li><strong>Officer:</strong> Grievance Redressal Officer</li>
          <li><strong>Entity:</strong> MotoHive Media Pvt. Ltd.</li>
          <li><strong>Email:</strong> privacy@store4riders.com / contact@store4riders.com</li>
          <li><strong>Helpline:</strong> +91 91751 77777</li>
          <li><strong>Address:</strong> Pune, Maharashtra, 411001, India</li>
        </ul>
      </section>
    </PolicyPageLayout>
  );
}
