import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { NavigationProgress } from "@/components/NavigationProgress";
import { BlinkitFloatingCart } from "@/components/ui/BlinkitFloatingCart";
import { CartDrawer } from "@/components/ui/CartDrawer";
import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";
import { buildWebSiteSchema, buildOrganizationSchema } from "@/core/utils/seo-schema";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Ultra-fast, SEO-friendly zero-layout-shift font optimization
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

const inter = Inter({ 
  subsets: ["latin"], 
  display: "swap", 
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const fbPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

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
        phone: process.env.NEXT_PUBLIC_STORE_PHONE || "+91 - 7263007788",
        email: "contact@store4riders.com",
        returnWindowDays: 7,
      }),
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} font-sans`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Google Tag Manager (GTM) */}
        {gtmId && (
          <Script
            id="gtm-container"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
        {/* Meta Facebook Pixel */}
        {fbPixelId && (
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${fbPixelId}');
fbq('track', 'PageView');`,
            }}
          />
        )}
      </head>
      <body className="antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        {/* GTM NoScript Fallback */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {/* Facebook Pixel NoScript Fallback */}
        {fbPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        <Providers>
          <NavigationProgress />
          <div className="flex-1 w-full">
            {children}
          </div>
          <BlinkitFloatingCart />
          <CartDrawer />
          <FloatingWhatsApp />
        </Providers>
      </body>
    </html>
  );
}
