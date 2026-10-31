import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://store4riders.com"
  ).replace(/\/+$/, "");

  const content = `# Store4Riders — Full Documentation & Catalog Context
> India's premier online destination for certified motorcycle riding gear, protective apparel, and touring accessories.

Store4Riders is an authorized, rider-focused multi-brand retailer based in Pune, Maharashtra, India. We deliver 100% genuine, manufacturer-warranted riding gear across every pin code in India. All safety equipment complies with international homologation standards including ECE 22.06, DOT FMVSS 218, and ISI IS 4151 for helmets, along with CE EN 1621-1 / EN 1621-2 / EN 17092 certifications for protective apparel and armor.

## Core Product Categories & Catalog Structure

### 1. Motorcycle Helmets
- [Motorcycle Helmets Catalog](${siteUrl}/motorcycle-helmets): Browse all certified motorcycle helmets.
- [Full Face Helmets](${siteUrl}/motorcycle-helmets/full-face-helmets): Maximum crash protection helmets with integrated sun visors, Pinlock anti-fog compatibility, and aerodynamic shells.
- [Modular / Flip-Up Helmets](${siteUrl}/motorcycle-helmets/modular-helmets): Dual-homologated (P/J) touring helmets offering the convenience of an open face with the chin-bar safety of a full face helmet.
- [Off-Road & Adventure Helmets](${siteUrl}/motorcycle-helmets/off-road-helmets): Motocross and ADV helmets with extended sun peaks, wide eye ports for goggles, and optimized ventilation.
- [Open Face Helmets](${siteUrl}/motorcycle-helmets/open-face-helmets): Classic urban cruiser and cafe racer 3/4 helmets meeting ISI and DOT safety certifications.
- [Helmet Visors & Accessories](${siteUrl}/motorcycle-helmets/helmet-accessories): Replacement scratch-resistant visors, Pinlock 30/70/120 anti-fog inserts, tinted and iridium shields.
- [Bluetooth Helmet Intercoms](${siteUrl}/motorcycle-helmets/bluetooth-intercoms): Mesh and Bluetooth communication systems for riders and pillions from Cardo and Sena.

### 2. Protective Riding Jackets
- [Riding Jackets Catalog](${siteUrl}/riding-gear/riding-jackets): Certified mesh, Cordura, and leather motorcycle riding jackets.
- Summer Mesh Jackets: High-airflow mesh construction engineered for Indian summer climates, featuring CE Level 2 shoulder and elbow protectors with back armor pockets.
- All-Weather Cordura Jackets: Multi-season touring jackets with removable thermal winter liners and waterproof rain membranes.
- Leather Racing Jackets: Heavy-duty cowhide leather jackets equipped with external TPU shoulder sliders for track and aggressive sport riding.

### 3. Riding Pants & Armor
- [Riding Pants Catalog](${siteUrl}/riding-gear/riding-pants): Textile trousers and Kevlar-reinforced jeans.
- [Motorcycle Riding Jeans](${siteUrl}/riding-gear/riding-pants/motorcycle-riding-jeans): Street-styled riding denim lined with genuine DuPont Kevlar / aramid fibers and removable knee armor.
- [Touring Pants](${siteUrl}/riding-gear/riding-pants/touring-pants): Waterproof adventure riding trousers with stretch accordion panels and waist adjusters.
- [Knee & Body Protectors](${siteUrl}/riding-gear/riding-jackets/protectors-armour): Standalone bionic knee guards, chest armor, and CE Level 2 replacement back protectors.

### 4. Riding Gloves
- [Riding Gloves Catalog](${siteUrl}/riding-gear/riding-gloves): Premium hand protection for street, track, and touring.
- [Full Gauntlet Gloves](${siteUrl}/riding-gear/riding-gloves/full-gauntlet-gloves): Track racing gloves with carbon fiber / TPU knuckle protectors, scaphoid palm sliders, and little finger bridge.
- [Short Cuff Motorbike Gloves](${siteUrl}/riding-gear/riding-gloves/short-motorbike-gloves): Lightweight urban gloves featuring touchscreen-sensitive fingertips and breathable mesh panels.

### 5. Motorcycle Boots & Footwear
- [Riding Boots Catalog](${siteUrl}/riding-gear/motorcycle-riding-boots): Protective footwear engineered for motorcycle control and ankle stabilization.
- [Track Racing Boots](${siteUrl}/riding-gear/motorcycle-riding-boots/sports-riding-shoes): Full-height racing boots with replaceable toe sliders, torsion control ankle bracing, and rigid shin plates.
- [Short Riding Shoes](${siteUrl}/riding-gear/motorcycle-riding-boots/short-biking-boots): Reinforced ankle boots suitable for daily commuting and weekend rides.
- [Adventure Touring Boots](${siteUrl}/riding-gear/motorcycle-riding-boots/off-road-riding-boots): Tall, waterproof leather boots with lugged rubber soles for rugged on/off-road riding.

### 6. Touring Luggage & Accessories
- [Touring Gear Catalog](${siteUrl}/riding-gear/touring-gear): Storage and luggage solutions for motorcycle expeditions.
- Tail Bags & Duffels: Expandable, waterproof universal-mount rear seat tail bags.
- Tank Bags: Quick-release magnetic and harness tank bags with transparent smartphone navigation pockets.
- Saddlebags: Heavy-duty side panniers designed to clear exhausts with included rain covers.

## Featured Brands
- [Axor Helmets](${siteUrl}/brands/axor): Apex, Street, Retro, and Brutale helmets engineered with international certification standards.
- [MT Helmets](${siteUrl}/brands/mt-helmets): Thunder 4 SV, Blade 2 SV, Jarama, and Targo helmets featuring ECE 22.06 compliance.
- [SMK Helmets](${siteUrl}/brands/smk): Stellar, Titan, Gullwing, and Typhoon aerodynamically optimized helmets.
- [LS2 Helmets](${siteUrl}/brands/ls2): Pioneer, Stream, Vector, and Storm helmet models with composite fiberglass and kinetic polymer shells.
- [AGV Helmets](${siteUrl}/brands/agv): K1 S, K3, K6 S, and Pista GP RR championship-proven helmets.
- [Rynox Gears](${siteUrl}/brands/rynox): Stealth Evo, Tornado Pro, Air GT jackets, Advento pants, and Expedition luggage.
- [BBG (Biking Brotherhood Gears)](${siteUrl}/brands/bbg): Explorer, Voyager, and Bullet series riding apparel.
- [Alpinestars](${siteUrl}/brands/alpinestars): SMX boots, T-SP jackets, SP gloves, and Nucleon body armor.

## Policies & Customer Guarantees
- [Size & Gear Exchange Policy](${siteUrl}/exchange): We offer a strict 7-day size exchange guarantee. Unworn gear with original tags and packaging can be exchanged for an alternative size or store credit.
- [Returns Policy](${siteUrl}/returns): Clear instructions for initiating exchanges, reporting damaged goods upon arrival, and warranty inspections.
- [Shipping & Delivery](${siteUrl}/shipping): Direct doorstep delivery across India via premier courier partners (Delhivery, BlueDart, Xpressbees). Orders above ₹999 qualify for free standard shipping.
- [Cash on Delivery (COD)](${siteUrl}/cash-on-delivery): Cash on delivery is supported across major Indian postal codes with mobile verification.
- [Warranty Policy](${siteUrl}/warranty): All products are covered under legitimate manufacturer warranties against structural and manufacturing defects.

## Support & Contact Information
- [Help & Support Center](${siteUrl}/support): Common sizing questions, helmet fitment guides, and order tracking assistance.
- [Contact Customer Care](${siteUrl}/contact):
  - Email: contact@store4riders.com / support@store4riders.com
  - Central Distribution Hub: Pune, Maharashtra, India
  - Operating Hours: Monday to Saturday, 10:00 AM - 7:00 PM IST
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
