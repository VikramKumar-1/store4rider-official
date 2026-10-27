import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { NavigationProgress } from "@/components/NavigationProgress";
import { BlinkitFloatingCart } from "@/components/ui/BlinkitFloatingCart";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { buildWebSiteSchema, buildOrganizationSchema } from "@/core/utils/seo-schema";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

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
    default: "Store4Riders - Buy Riding Gear Online | Helmet online",
    template: "%s",
  },
  description: "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
  keywords: [
    "Biker helmets",
    "riding jacket",
    "biker gloves",
    "motorcycle helmet",
    "riding boots",
    "bike accessories near me",
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
    title: "Store4Riders - Buy Riding Gear Online | Helmet online",
    description: "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Store4Riders - Buy Riding Gear Online | Helmet online",
    description: "Buy top quality motorcycle accessories, motorcycle boots, Biking gear, riding suits and more. Best helmet brands in India available. Best Riding gear @ India's online riding gear shop.",
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
      buildWebSiteSchema(siteUrl),
      buildOrganizationSchema({
        siteUrl,
        phone: process.env.NEXT_PUBLIC_STORE_PHONE,
        email: "contact@store4riders.com",
        returnWindowDays: 7,
      }),
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        <Providers>
          <NavigationProgress />
          <div className="flex-1 w-full">
            {children}
          </div>
          <BlinkitFloatingCart />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
