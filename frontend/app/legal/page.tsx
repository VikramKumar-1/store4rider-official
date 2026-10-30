import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Building2, ShieldCheck, FileCheck } from "lucide-react";
import { PolicyPageLayout } from "@/components/layout/PolicyPageLayout";

export const metadata: Metadata = {
  title: "Legal Information & Corporate Disclosures | Store4Riders",
  description:
    "Statutory corporate entity disclosures, regulatory compliance, GST registration, and legal terms for Store4Riders.",
  alternates: {
    canonical: "https://store4riders.com/legal",
  },
};

export default function LegalPage() {
  return (
    <PolicyPageLayout
      title="Legal Information & Disclosures"
      subtitle="Statutory disclosures, corporate identity, regulatory compliance under Indian e-commerce legislation, and consumer protection information."
      badge="Corporate Compliance"
      badgeIcon={<Scale size={14} className="text-brand shrink-0" />}
      lastUpdated="October 2026"
      currentSlug="/legal"
      summaryAlert={{
        type: "brand",
        title: "Statutory E-Commerce Disclosures",
        text: (
          <span>
            In compliance with Rule 5 of the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000, Store4Riders publishes full statutory, tax, and grievance redressal officer disclosures below.
          </span>
        ),
      }}
    >
      <section>
        <h2>1. Corporate Identity and Registered Office</h2>
        <p>
          The e-commerce platform <strong>Store4Riders</strong> (accessible at <code>https://store4riders.com</code>) is owned, hosted, and operated by:
        </p>

        <div className="overflow-x-auto my-4">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-1/3 font-bold bg-slate-50">Legal Entity Name</td>
                <td><strong>MotoHive Media Private Limited</strong></td>
              </tr>
              <tr>
                <td className="font-bold bg-slate-50">Trading / Brand Name</td>
                <td><strong>Store4Riders</strong></td>
              </tr>
              <tr>
                <td className="font-bold bg-slate-50">Corporate Identity Number (CIN)</td>
                <td>U74999PN2015PTC155480</td>
              </tr>
              <tr>
                <td className="font-bold bg-slate-50">Registered Corporate Office</td>
                <td>Pune, Maharashtra - 411001, India</td>
              </tr>
              <tr>
                <td className="font-bold bg-slate-50">Operational Fulfillment Hub</td>
                <td>Store4Riders Central Logistics Hub, Pune, Maharashtra, India</td>
              </tr>
              <tr>
                <td className="font-bold bg-slate-50">Customer Support Desk</td>
                <td>+91 91751 77777 (Mon - Sat, 10:00 AM - 7:00 PM IST)</td>
              </tr>
              <tr>
                <td className="font-bold bg-slate-50">Official Email</td>
                <td>contact@store4riders.com / legal@store4riders.com</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>2. Taxation and GST Disclosures</h2>
        <p>
          MotoHive Media Pvt. Ltd. is fully registered with the Goods and Services Tax Network (GSTN) under the Central Goods and Services Tax Act, 2017 and Maharashtra State GST regulations.
        </p>
        <ul>
          <li>
            Every commercial transaction completed on Store4Riders generates a valid computer-generated GST Tax Invoice detailing HSN codes, applicable tax rates (CGST, SGST, or IGST), and itemized values.
          </li>
          <li>
            Registered corporate buyers and retail firms may enter their valid 15-digit GSTIN during checkout to avail of legitimate Input Tax Credit (ITC).
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Consumer Protection (E-Commerce) Rules, 2020 Compliance</h2>
        <p>
          Store4Riders strictly observes the provisions of the Consumer Protection (E-Commerce) Rules, 2020 notified under the Consumer Protection Act, 2019:
        </p>
        <ul>
          <li>
            <strong>Country of Origin Disclosures:</strong> In accordance with statutory guidelines, product pages disclose the brand, authorized manufacturer or importer, and country of manufacture or assembly.
          </li>
          <li>
            <strong>Pricing Transparency:</strong> Product prices clearly indicate the total purchase price alongside a breakdown of all mandatory charges, statutory GST taxes, and shipping fees.
          </li>
          <li>
            <strong>Genuine Product Authenticity:</strong> Store4Riders operates as an authorized retailer for all riding gear brands listed on our platform. We maintain a zero-tolerance policy against counterfeit or replica helmets and riding protectors.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Safety Standards and Certifications</h2>
        <p>
          Motorcycle helmets and armored apparel are subject to international and Indian safety regulations:
        </p>
        <ul>
          <li>
            <strong>Motorcycle Helmets:</strong> Meet or exceed certified global standards including <strong>ECE 22.06</strong> (Economic Commission for Europe), <strong>DOT FMVSS No. 218</strong> (US Department of Transportation), and <strong>BIS IS 4151</strong> (Bureau of Indian Standards) as indicated on the specific product specifications.
          </li>
          <li>
            <strong>Impact Armor Inserts:</strong> Riding jackets, pants, and boots incorporate armor certified to European standard <strong>CE EN 1621-1</strong> (limb protectors) and <strong>CE EN 1621-2</strong> (back protectors) at Level 1 or Level 2.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Grievance Redressal Mechanism</h2>
        <p>
          If you have any unresolved queries, delivery complaints, or compliance concerns, our appointed Grievance Redressal Officer may be reached directly:
        </p>
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs sm:text-sm">
          <p><strong>Grievance Redressal Officer:</strong> Compliance &amp; Customer Relations Desk</p>
          <p><strong>Entity:</strong> MotoHive Media Pvt. Ltd. (Store4Riders)</p>
          <p><strong>Email:</strong> grievance@store4riders.com / legal@store4riders.com</p>
          <p><strong>Helpline:</strong> +91 91751 77777</p>
          <p><strong>Response Timeline:</strong> Acknowledgement within 48 business hours; final resolution typically within 15 working days.</p>
        </div>
      </section>

      <section>
        <h2>6. Dispute Resolution and Legal Jurisdiction</h2>
        <p>
          All legal notices, proceedings, or arbitration concerning transactions, intellectual property, or policies associated with Store4Riders shall be governed by the laws of India and subject to the exclusive jurisdiction of the judicial courts in <strong>Pune, Maharashtra, India</strong>.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
