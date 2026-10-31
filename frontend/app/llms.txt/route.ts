import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://store4riders.com"
  ).replace(/\/+$/, "");

  const content = `# Store4Riders
> India's premier online destination for certified motorcycle riding gear, protective apparel, and touring accessories.

Store4Riders equips motorcyclists across India with 100% genuine, certified riding gear with express doorstep delivery. We stock international safety-standard helmets (ECE 22.06, DOT, ISI), CE-certified protective jackets, abrasion-resistant riding pants, track & street boots, reinforced gloves, and motorcycle touring luggage.

## Product Categories
- [Motorcycle Helmets](${siteUrl}/motorcycle-helmets): Full face helmets, modular flip-up helmets, open face, off-road motocross helmets, and carbon fiber track helmets certified to ECE 22.06, DOT, and ISI standards.
- [Riding Jackets](${siteUrl}/riding-gear/riding-jackets): Summer breathable mesh jackets, all-weather Cordura textile jackets, and track racing leather jackets with CE Level 2 armor.
- [Riding Pants](${siteUrl}/riding-gear/riding-pants): Protective Cordura textile riding pants, Kevlar motorcycle jeans, and all-weather touring trousers with CE certified armor inserts.
- [Riding Gloves](${siteUrl}/riding-gear/riding-gloves): Track-spec full gauntlet gloves, short cuff street riding gloves, and waterproof winter thermal gloves.
- [Riding Boots](${siteUrl}/riding-gear/motorcycle-riding-boots): High-ankle track racing boots, waterproof adventure touring boots, and urban street riding shoes.
- [Touring & Luggage](${siteUrl}/riding-gear/touring-gear): Motorcycle tail bags, magnetic and strap tank bags, saddlebags, and waterproof riding backpacks.
- [Women's Riding Gear](${siteUrl}/riding-gear-for-women): Ergonomically tailored motorcycle jackets, riding gloves, and protective gear designed for women riders.
- [All Riding Gear & Apparel](${siteUrl}/products): Browse the complete catalog of motorcycle protective equipment, riding apparel, and motorcycle accessories.
- [Sale & Offers](${siteUrl}/sale): Discounted motorcycle riding gear, clearance sales, seasonal promotions, and special bundle offers.

## Featured Brands
- [All Brands](${siteUrl}/brands): Official authorized retailer for premier international and domestic motorcycle gear brands.
- [Axor Helmets](${siteUrl}/brands/axor): Premium full face, retro, and touring motorcycle helmets certified to ECE 22.06 and DOT standards.
- [MT Helmets](${siteUrl}/brands/mt-helmets): Spanish helmet engineering featuring ECE 22.06 certified street, racing, and adventure helmets.
- [SMK Helmets](${siteUrl}/brands/smk): Italian-designed high-performance motorcycle helmets with advanced aerodynamic styling.
- [LS2 Helmets](${siteUrl}/brands/ls2): Internationally certified motorcycle helmets, protective riding apparel, and motorcycle gear.
- [AGV Helmets](${siteUrl}/brands/agv): MotoGP championship-proven track, sport, and premium street helmets.
- [Rynox Gears](${siteUrl}/brands/rynox): Indian-engineered touring jackets, adventure pants, gloves, and motorcycle luggage built for extreme conditions.
- [BBG (Biking Brotherhood Gears)](${siteUrl}/brands/bbg): Durable, value-focused motorcycle jackets, riding trousers, and track apparel.
- [Alpinestars](${siteUrl}/brands/alpinestars): World-renowned Italian brand for racing suits, protective jackets, track boots, and gloves.

## Guides & Rider Resources
- [Motorcycle Gear Guides](${siteUrl}/guides): Expert advice on helmet sizing, CE armor ratings (Level 1 vs Level 2), riding gear maintenance, and long-distance touring preparation.

## Policies & Customer Service
- [Size & Gear Exchange Policy](${siteUrl}/exchange): 7-day hassle-free size and gear exchange policy on unworn apparel with original tags.
- [Returns Policy](${siteUrl}/returns): Comprehensive guidelines on product return criteria, exchanges, and warranty claims.
- [Shipping & Delivery Policy](${siteUrl}/shipping): Express doorstep delivery across India with free shipping on qualifying orders above ₹999.
- [Cash on Delivery (COD)](${siteUrl}/cash-on-delivery): Payment terms, pin code availability, and verification guidelines for COD orders.
- [Customer Support](${siteUrl}/support): Frequently asked questions, sizing assistance, order status tracking, and rider support.
- [Warranty Information](${siteUrl}/warranty): Brand warranty coverage, claim submission guidelines, and manufacturer guarantees.

## Optional
- [About Store4Riders](${siteUrl}/about-us): The history, mission, and rider-first philosophy behind Store4Riders India.
- [Contact Us](${siteUrl}/contact): Customer care contact numbers, Pune distribution hub details, and official email addresses.
- [Privacy Policy](${siteUrl}/privacy): Data privacy policies, customer protection guidelines, and cookie disclosures.
- [Terms & Conditions](${siteUrl}/terms): Legal terms of service, platform policies, and purchase conditions.
- [Full Site Context (llms-full.txt)](${siteUrl}/llms-full.txt): Comprehensive extended catalog, policy details, and guides for LLMs and autonomous agents.
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}

