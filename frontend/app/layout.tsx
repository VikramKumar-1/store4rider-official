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

export const metadata: Metadata = {
  title: "Store4Riders | Premium Motorcycle Riding Gear",
  description: "Riding gear that keeps you safe. Explore jackets, suits, helmets & accessories.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
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
