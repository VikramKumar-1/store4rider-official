import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { NavigationProgress } from "@/components/NavigationProgress";
import { BlinkitFloatingCart } from "@/components/ui/BlinkitFloatingCart";
import { CartDrawer } from "@/components/ui/CartDrawer";

// Ultra-fast, SEO-friendly zero-layout-shift font optimization
const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap", 
  variable: "--font-inter" 
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Store4Riders | Premium Motorcycle Riding Gear",
    template: "%s | Store4Riders",
  },
  description: "India's leading destination for certified motorcycle riding helmets, jackets, boots, gloves, and riding accessories. Top brands, 100% authentic gear with fast shipping.",
  keywords: [
    "Store4Riders",
    "motorcycle riding gear",
    "motorcycle helmets",
    "full face helmets",
    "riding jackets",
    "riding boots",
    "riding gloves",
    "biker gear india",
  ],
  authors: [{ name: "Store4Riders" }],
  creator: "Store4Riders",
  publisher: "Store4Riders",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Store4Riders",
    title: "Store4Riders | Premium Motorcycle Riding Gear",
    description: "Certified motorcycle riding helmets, jackets, boots, gloves & accessories. Free shipping on select orders.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Store4Riders | Premium Motorcycle Riding Gear",
    description: "Certified motorcycle riding helmets, jackets, boots, gloves & accessories.",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Store4Riders",
        description: "Premium Motorcycle Riding Gear Store",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": `${siteUrl}/#organization`,
        name: "Store4Riders",
        url: siteUrl,
        logo: `${siteUrl}/Store4riders-Logo.jpg`,
        image: `${siteUrl}/Store4riders-Logo.jpg`,
        description: "India's leading destination for certified motorcycle riding helmets, jackets, boots, gloves, and riding accessories.",
        ...(process.env.NEXT_PUBLIC_STORE_PHONE ? { telephone: process.env.NEXT_PUBLIC_STORE_PHONE } : {}),
        email: "contact@store4riders.com",
        acceptedPaymentMethod: [
          "Cash on Delivery",
          "Credit Card",
          "Debit Card",
          "UPI",
          "Net Banking",
          "EMI",
        ],
        address: {
          "@type": "PostalAddress",
          addressCountry: "IN",
        },
        contactPoint: {
          "@type": "ContactPoint",
          ...(process.env.NEXT_PUBLIC_STORE_PHONE ? { telephone: process.env.NEXT_PUBLIC_STORE_PHONE } : {}),
          email: "contact@store4riders.com",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["English", "Hindi"],
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "IN",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 7,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn",
        },
        sameAs: [
          "https://www.facebook.com/store4riders/",
          "https://www.instagram.com/store4riders/",
          "https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg",
        ],
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans">
        <Providers>
          <NavigationProgress />
          <main className="flex-1">
            {children}
          </main>
          <BlinkitFloatingCart />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
