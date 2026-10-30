import {
  ArrowLeftRight,
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Truck,
  BookOpen,
  Info,
  Clock,
  Compass,
  Wrench,
  HeartHandshake,
  LucideIcon,
} from "lucide-react";

export interface OfficialPageDefinition {
  slug: string;
  name: string;
  icon: LucideIcon;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBadge: string;
  defaultAlert?: {
    type: "info" | "warning" | "success" | "brand";
    title: string;
    text: string;
  };
  defaultHtml: string;
}

export const OFFICIAL_PAGE_DEFINITIONS: OfficialPageDefinition[] = [
  {
    slug: "returns",
    name: "Exchange & Returns",
    icon: ArrowLeftRight,
    defaultTitle: "Exchange & Replacement Policy",
    defaultSubtitle:
      "Because motorcycle safety depends on a precise, secure fit, Store4Riders provides a dedicated 7-Day Size & Gear Exchange on all eligible riding essentials.",
    defaultBadge: "7-Day Fit Guarantee",
    defaultAlert: {
      type: "warning",
      title: "Strict Exchange-Only Policy",
      text: "Store4Riders operates on an Exchange & Replacement model for size adjustments or defective items. Direct cash or bank refunds are not provided once an order has been successfully delivered in accordance with store policy.",
    },
    defaultHtml: `<h2>1. 7-Day Hassle-Free Size Exchange</h2>
<p>Because motorcycle safety gear must fit securely to deliver full impact protection, Store4Riders offers a seamless <strong>7-Day Size &amp; Fit Exchange</strong> from the date of confirmed delivery. If your helmet, jacket, gloves, pants, or boots do not fit properly, we will happily exchange them for the correct size or alternative model.</p>

<h2>2. Eligibility Criteria for Exchange</h2>
<p>To ensure high hygiene and safety standards for all riders, items submitted for exchange must strictly fulfill these requirements:</p>
<ul>
  <li><strong>Unused &amp; Unworn:</strong> The gear must not show any signs of outdoor road use, dirt, sweat, or scent.</li>
  <li><strong>Original Tags &amp; Packaging:</strong> All manufacturer tags, CE armor inserts, manuals, and original branded box must be intact.</li>
  <li><strong>Helmet Visor Peels:</strong> Protective protective film on helmet visors must remain completely unpeeled.</li>
  <li><strong>Timely Notice:</strong> Exchange request must be submitted within 7 days of package delivery.</li>
</ul>

<h2>3. Reverse Pickup &amp; Replacement Process</h2>
<p>Store4Riders coordinates reverse logistics directly from your doorstep across India:</p>
<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
  <thead>
    <tr>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Step</th>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Action</th>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Estimated Timeline</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">1. Raise Request</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Submit exchange via My Orders or email contact@store4riders.com with photos.</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Within 24 Hours</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">2. Doorstep Pickup</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Our courier partners pick up the packaged gear from your address.</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">2 to 3 Business Days</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">3. QC &amp; Dispatch</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">After warehouse quality inspection, replacement size is dispatched immediately.</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">24 to 48 Hours post QC</td>
    </tr>
  </tbody>
</table>

<blockquote style="border-left: 4px solid #AB1509; background-color: #fdf2f2; padding: 1rem 1.25rem; border-radius: 0 0.75rem 0.75rem 0; color: #7f1d1d; margin: 1.5rem 0;">
  <strong>Important Note:</strong> Products marked as "Final Clearance", customized decals, balaclavas, undergarments, and base layers cannot be exchanged due to statutory hygiene guidelines.
</blockquote>`,
  },
  {
    slug: "shipping",
    name: "Shipping & Delivery",
    icon: Truck,
    defaultTitle: "Shipping & Delivery Policy",
    defaultSubtitle:
      "Express, insured pan-India delivery for premium motorcycle helmets, riding gear, and performance parts.",
    defaultBadge: "Pan-India Shipping",
    defaultAlert: {
      type: "brand",
      title: "Real-Time Tracking & Insured Transit",
      text: "Every order dispatched from Store4Riders warehouses is 100% transit-insured and tracked in real-time with verified courier partner SMS and WhatsApp updates.",
    },
    defaultHtml: `<h2>1. Order Processing Time</h2>
<p>Orders placed before 2:00 PM IST on business days (Monday to Saturday) are verified and handed over to our logistics partners on the same day. Orders placed after 2:00 PM or on public holidays are dispatched on the next operational business day.</p>

<h2>2. Estimated Delivery Timeframes</h2>
<p>We partner with leading express couriers (Blue Dart, Delhivery, DTDC, Xpressbees) to ensure rapid, dependable delivery across India:</p>
<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
  <thead>
    <tr>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Destination Region</th>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Courier Mode</th>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Estimated Timeline</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Metro Cities (Mumbai, Delhi, Bengaluru, Pune, etc.)</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Air Express</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">2 to 4 Business Days</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Tier 2 &amp; Tier 3 Cities</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Surface Express</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">4 to 6 Business Days</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">North East, J&amp;K, Remote Hill Regions</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">Special Logistics</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">6 to 9 Business Days</td>
    </tr>
  </tbody>
</table>

<h2>3. Packaging &amp; Helmet Protection</h2>
<p>Helmets and delicate electronics (Bluetooth intercoms, cameras) are packaged with multi-layer heavy bubble wrap, corner guards, and sealed outer cartons to eliminate any shock during transit.</p>`,
  },
  {
    slug: "cash-on-delivery",
    name: "Cash on Delivery",
    icon: Clock,
    defaultTitle: "Cash on Delivery (COD) Policy",
    defaultSubtitle:
      "Transparent terms and verification guidelines for Cash on Delivery orders at Store4Riders.",
    defaultBadge: "Payment Terms",
    defaultAlert: {
      type: "info",
      title: "Telephonic Order Verification",
      text: "To eliminate fake bookings and reduce courier rejection on high-value riding gear, all COD orders undergo automated OTP or voice confirmation prior to warehouse dispatch.",
    },
    defaultHtml: `<h2>1. Availability of Cash on Delivery</h2>
<p>Cash on Delivery is available across 18,000+ pin codes in India for orders up to <strong>₹15,000</strong>. For high-value professional riding gear above ₹15,000, secure online prepaid checkout (UPI, Credit/Debit Cards, Net Banking, EMI) is required for shipping insurance compliance.</p>

<h2>2. Order Confirmation Process</h2>
<p>Once you place a COD order, our operations desk will send an OTP via SMS and WhatsApp. Our rider concierge may also call you to verify your helmet/apparel sizing to prevent sizing mismatches and avoidable return courier charges.</p>

<h2>3. Delivery &amp; Handover Guidelines</h2>
<ul>
  <li>Please keep exact cash ready or use courier UPI QR codes provided by the delivery partner at the time of doorstep handover.</li>
  <li>Open-box inspection prior to cash payment is not permitted under courier partner service agreements. Once paid and accepted, our 7-Day Size Exchange policy protects your purchase completely.</li>
</ul>`,
  },
  {
    slug: "warranty",
    name: "Warranty & Claims",
    icon: ShieldCheck,
    defaultTitle: "Manufacturer Warranty & Claims",
    defaultSubtitle:
      "Store4Riders is an authorized dealer for genuine riding gear. We facilitate full manufacturer warranty coverage.",
    defaultBadge: "100% Genuine Gear",
    defaultAlert: {
      type: "success",
      title: "Direct Brand Warranty Facilitation",
      text: "All products sold on Store4Riders come with official manufacturer warranty against manufacturing defects in stitching, zippers, armor shells, and electronic components.",
    },
    defaultHtml: `<h2>1. Authorized Brand Warranty Coverage</h2>
<p>Store4Riders only stocks authentic, brand-certified motorcycle riding apparel and accessories. Every product comes with standard warranty coverage provided directly by the official manufacturer or primary Indian importer.</p>

<h2>2. Typical Warranty Durations by Category</h2>
<ul>
  <li><strong>ECE / DOT Certified Helmets:</strong> 1 Year to 5 Years (varies by brand manufacturer policy) on shell integrity and EPS structure.</li>
  <li><strong>Riding Jackets &amp; Pants:</strong> 6 Months to 1 Year on YKK zippers, seams, and fabric manufacturing flaws.</li>
  <li><strong>Bluetooth Intercom Systems:</strong> 1 Year to 2 Years manufacturer replacement/repair warranty.</li>
  <li><strong>Riding Boots &amp; Gloves:</strong> 6 Months standard coverage against sole separation or seam defects.</li>
</ul>

<h2>3. What is Not Covered Under Warranty</h2>
<p>Warranty strictly covers manufacturing and material defects. It does not cover:</p>
<ul>
  <li>Accidental crash damage, road rash, or abrasive scrapes.</li>
  <li>Normal aesthetic wear and tear, color fading from prolonged UV exposure, or improper washing.</li>
  <li>Modifications, aftermarket alterations, or unapproved repair attempts.</li>
</ul>`,
  },
  {
    slug: "terms",
    name: "Terms of Service",
    icon: FileText,
    defaultTitle: "Conditions of Sale & Website Use",
    defaultSubtitle:
      "Legal agreement and terms governing your purchases and use of Store4Riders e-commerce platform.",
    defaultBadge: "Legal Terms",
    defaultAlert: {
      type: "info",
      title: "Legally Binding Agreement",
      text: "By accessing or placing an order on Store4Riders.com, you agree to be bound by these Conditions of Sale and our associated store policies.",
    },
    defaultHtml: `<h2>1. Overview &amp; Acceptance</h2>
<p>This website is operated by Store4Riders. Throughout the site, the terms "we", "us" and "our" refer to Store4Riders. By visiting our site and purchasing products from us, you engage in our "Service" and agree to be bound by the following terms and conditions.</p>

<h2>2. Accuracy of Product Information &amp; Pricing</h2>
<p>We make every effort to display accurate colorways, technical specifications, and sizing dimensions. However, motorcycle gear manufacturers periodically update graphic decals or internal liners. Product descriptions are kept as accurate as commercially possible.</p>

<h2>3. Intellectual Property</h2>
<p>All trademarks, logos, brand names, product photography, and text displayed on this website are the property of Store4Riders or their respective motorcycle gear manufacturer licensors.</p>`,
  },
  {
    slug: "privacy",
    name: "Privacy Policy",
    icon: Lock,
    defaultTitle: "Privacy & Data Protection Policy",
    defaultSubtitle:
      "We respect your privacy and protect your personal riding data, address information, and payment transactions.",
    defaultBadge: "Data Security",
    defaultAlert: {
      type: "info",
      title: "Zero Third-Party Data Selling",
      text: "Store4Riders does not sell, rent, or trade your personal information, phone numbers, or order history to third-party telemarketers.",
    },
    defaultHtml: `<h2>1. Information We Collect</h2>
<p>When you create an account, purchase products, or interact with our rider desk, we collect necessary transactional information: full name, shipping and billing addresses, phone number, email address, and order history.</p>

<h2>2. Payment Information Security</h2>
<p>We do not store your credit card, debit card, or net banking credentials on our servers. All financial transactions are processed through RBI-compliant, PCI-DSS Level 1 certified payment gateways (PayU, CCAvenue, Cashfree).</p>

<h2>3. Use of Cookies</h2>
<p>We utilize standard functional and session cookies to remember items in your shopping cart, maintain authentication status, and deliver personalized product recommendations.</p>`,
  },
  {
    slug: "legal",
    name: "Legal Information",
    icon: Scale,
    defaultTitle: "Legal Information & Compliance",
    defaultSubtitle:
      "Statutory business registrations, tax compliance, and consumer dispute redressal information.",
    defaultBadge: "Statutory Compliance",
    defaultAlert: {
      type: "info",
      title: "Consumer Protection & Fair Trading",
      text: "Store4Riders complies with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020.",
    },
    defaultHtml: `<h2>1. Entity Details &amp; Registration</h2>
<p>Store4Riders is an Indian registered e-commerce enterprise specializing in high-performance motorcycle accessories, protective apparel, and touring gear.</p>

<h2>2. GST &amp; Tax Compliance</h2>
<p>All prices displayed on Store4Riders are inclusive of applicable Goods and Services Tax (GST). Formal GST-compliant tax invoices are issued with every order and available for download in My Account.</p>

<h2>3. Grievance Officer</h2>
<p>In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, you may address statutory grievances to our designated Grievance Officer at legal@store4riders.com.</p>`,
  },
  {
    slug: "store-policies",
    name: "Store Policies",
    icon: BookOpen,
    defaultTitle: "Consolidated Store Policies",
    defaultSubtitle:
      "A complete overview of our customer satisfaction commitments, fair trade rules, and rider support standards.",
    defaultBadge: "Policy Handbook",
    defaultAlert: {
      type: "brand",
      title: "Rider First Commitment",
      text: "Everything we do at Store4Riders is built around rider safety, genuine gear authenticity, and dependable customer service.",
    },
    defaultHtml: `<h2>1. The Store4Riders Standard</h2>
<p>Store4Riders was founded by motorcycle enthusiasts with one mission: to make world-class motorcycle protection accessible and transparent to riders across India. We strictly stock certified CE Level 1 and Level 2 armor and helmets compliant with ISI, DOT, and ECE 22.06 safety standards.</p>

<h2>2. Authentic Sourcing Guarantee</h2>
<p>Every product in our inventory is procured through authorized manufacturer distribution channels. We reject unauthorized gray-market imports that lack valid serial numbers or brand warranty backing.</p>`,
  },
  {
    slug: "about-us",
    name: "About Store4Riders",
    icon: Info,
    defaultTitle: "About Store4Riders",
    defaultSubtitle:
      "Fueling two-wheel adventures with certified motorcycle protection, touring gear, and rider community passion.",
    defaultBadge: "Our Story",
    defaultAlert: {
      type: "brand",
      title: "Curated by Riders, for Riders",
      text: "Every jacket, helmet, boot, and intercom in our store is handpicked and field-tested by veteran adventure and track enthusiasts.",
    },
    defaultHtml: `<h2>1. Who We Are</h2>
<p>Store4Riders is India's premier destination for motorcycle protective gear, riding apparel, and touring accessories. Born out of a deep passion for long-distance motorcycle touring and weekend track days, our mission is to ensure every rider hits the road safely equipped with authentic, international-standard protective gear.</p>

<h2>2. Why Thousands of Riders Trust Us</h2>
<ul>
  <li><strong>100% Genuine Products:</strong> Sourced directly from certified brand distributors.</li>
  <li><strong>Expert Sizing Guidance:</strong> Personalized size recommendations by certified gear specialists.</li>
  <li><strong>Fast Express Shipping:</strong> Secure transit insurance and express dispatch across 18,000+ pin codes.</li>
  <li><strong>Hassle-Free Fit Exchange:</strong> Dedicated 7-day exchange window so your gear fits like a glove.</li>
</ul>`,
  },
  {
    slug: "rider-assist",
    name: "Rider Assist & Sizing",
    icon: Compass,
    defaultTitle: "Rider Assist & Sizing Guide",
    defaultSubtitle:
      "Professional sizing charts and fitment advice to help you choose the right helmet, jacket, gloves, and boots.",
    defaultBadge: "Expert Sizing",
    defaultAlert: {
      type: "info",
      title: "Need Sizing Advice?",
      text: "If you are unsure between two sizes, reach out to our Rider Support team before ordering. We help you choose the right fit based on your body measurements.",
    },
    defaultHtml: `<h2>1. How to Measure for a Motorcycle Helmet</h2>
<p>Wrap a flexible tape measure horizontally around your head, approximately 1 inch (2.5 cm) above your eyebrows and just above your ears. This corresponds to the largest circumference of your head.</p>

<table style="width: 100%; border-collapse: collapse; margin: 1.5rem 0;">
  <thead>
    <tr>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Size</th>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Circumference (CM)</th>
      <th style="background-color: #f8fafc; padding: 0.75rem 1rem; border: 1px solid #e2e8f0; text-align: left;">Circumference (Inches)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">Small (S)</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">55 - 56 cm</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">21.6 - 22.0 in</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">Medium (M)</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">57 - 58 cm</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">22.4 - 22.8 in</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">Large (L)</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">59 - 60 cm</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">23.2 - 23.6 in</td>
    </tr>
    <tr>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0; font-weight: bold;">X-Large (XL)</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">61 - 62 cm</td>
      <td style="padding: 0.75rem 1rem; border: 1px solid #e2e8f0;">24.0 - 24.4 in</td>
    </tr>
  </tbody>
</table>

<h2>2. How a Brand-New Helmet Should Fit</h2>
<p>A new helmet should feel snug against your cheeks and forehead without painful pinch points. Cheek pads will break in and compress by approximately 10-15% after 15 to 20 hours of ride time.</p>`,
  },
  {
    slug: "care",
    name: "Gear Care Guide",
    icon: Wrench,
    defaultTitle: "Motorcycle Gear Care & Maintenance Guide",
    defaultSubtitle:
      "Expert tips on cleaning, conditioning, and storing your riding jackets, leather gear, and helmets to prolong life and maintain safety.",
    defaultBadge: "Maintenance Guide",
    defaultAlert: {
      type: "success",
      title: "Prolong Gear Lifespan",
      text: "Regular cleaning and proper conditioning keep waterproof membranes breathable and leather supple for years of riding adventures.",
    },
    defaultHtml: `<h2>1. Helmet Care &amp; Visor Cleaning</h2>
<p>Clean helmet visors only with lukewarm water and a clean microfiber cloth. Never use aggressive petroleum-based glass cleaners or ammonia sprays, which dissolve the anti-scratch and anti-fog coatings.</p>

<h2>2. Textile Jacket &amp; Pants Washing</h2>
<ul>
  <li>Always remove CE armor pads (shoulders, elbows, back, knees) before washing.</li>
  <li>Use mild liquid tech-wash detergent; avoid fabric softeners which clog breathable waterproof pores.</li>
  <li>Air dry naturally in shade; never tumble dry riding gear.</li>
</ul>

<h2>3. Leather Suit &amp; Glove Conditioning</h2>
<p>Wipe sweat and road grime with a damp towel after every major ride. Apply dedicated leather beeswax balm or lanolin conditioner once every season to prevent drying and cracking.</p>`,
  },
  {
    slug: "collaboration",
    name: "Collaboration & Partners",
    icon: HeartHandshake,
    defaultTitle: "Collaboration & Riding Clubs Program",
    defaultSubtitle:
      "Partnering with motovloggers, touring groups, riding academies, and automotive events across India.",
    defaultBadge: "Partner Program",
    defaultAlert: {
      type: "brand",
      title: "Join the Store4Riders Community",
      text: "Are you a moto content creator, track day organizer, or motorcycle club president? Let's build epic riding experiences together.",
    },
    defaultHtml: `<h2>1. Riding Club Partnerships</h2>
<p>Store4Riders partners with verified motorcycle clubs and riding communities across India, offering exclusive club group-buy privileges, event sponsorship, and track day safety equipment support.</p>

<h2>2. Moto Creators &amp; Influencer Program</h2>
<p>If you create high-quality motorcycle adventure content, touring reviews, or safety education videos on YouTube or Instagram, we invite you to collaborate with us for gear reviews and community giveaways.</p>

<h2>3. How to Apply</h2>
<p>Reach out to our partnerships team at <strong>partners@store4riders.com</strong> with your club profile or social media handles.</p>`,
  },
];
