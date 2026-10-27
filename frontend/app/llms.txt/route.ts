import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://store4riders.com";

  const content = `# Store4Riders
> India's premier online destination for certified motorcycle riding gear, protective apparel, and touring accessories.

## Overview
Store4Riders provides 100% genuine, certified motorcycle safety gear with express shipping across all states in India. We equip riders with international-standard helmets (ECE 22.06, DOT, ISI), CE-certified protective jackets, armored riding pants, track & street boots, gloves, and touring luggage.

## Core Product Categories
- Helmets: Full Face, Modular, Open Face, Dual Sport / Adventure, Carbon Fiber, Track-Spec
- Riding Jackets: Summer Mesh, All-Weather Cordura, Leather Racing, Waterproof Touring
- Riding Pants: Cordura Textile, Kevlar Denim, CE Armor Inserted Touring Trousers
- Riding Boots: Full-Length Track Boots, Short Ankle Boots, Waterproof Adventure / Touring Boots
- Riding Gloves: Short Cuff Street Gloves, Full Gauntlet Track Gloves, Winter Waterproof Gloves
- Riding Protection: Back Protectors, Chest Guards, Knee Guards, Kidney Belts
- Luggage & Accessories: Tail Bags, Tank Bags, Saddlebags, Waterproof Backpacks, Mobile Mounts, Helmet Intercoms

## Featured Brands
- Axor Helmets
- MT Helmets
- SMK Helmets
- LS2 Helmets
- AGV Helmets
- Rynox Gears
- BBG (Biking Brotherhood Gears)
- DSG
- Alpinestars
- Falco Boots
- Cardo Systems
- Sena Bluetooth Intercoms

## Store Policies & Guidelines
- Authenticity: 100% original manufacturer products with official brand warranties.
- Size & Fit Exchange Guarantee: Strict 7-day hassle-free size & gear exchange policy on unworn apparel with original tags (replacement or store credit; no monetary refunds).
- Shipping: Express doorstep delivery across India. Free shipping on qualifying orders above ₹999.
- Payment Methods: Credit/Debit Cards, UPI (Google Pay, PhonePe, Paytm), Net Banking, EMI, Cash on Delivery (COD).

## Key URLs
- Homepage: ${siteUrl}
- All Products: ${siteUrl}/products
- Sale & Offers: ${siteUrl}/sale
- Riding Guides & Advice: ${siteUrl}/guides
- Size & Exchange Policy: ${siteUrl}/returns
- Shipping & Delivery: ${siteUrl}/shipping
- Customer Support: ${siteUrl}/support
- Contact Us: ${siteUrl}/contact

## Customer Care
- Email: contact@store4riders.com / support@store4riders.com
- Central Distribution: Pune, Maharashtra, India
- Hours: Monday - Saturday, 10:00 AM - 7:00 PM IST
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
