import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/core/database/connection";
import { ProductModel } from "@/modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const frontendToMagento: Record<string, string[]> = {
      // Helmets
      "modular-helmets": ["modular-helmets", "flip-up-helmets", "smk-glide-modular-helmet"],
      "half-face-helmets": ["half-face-helmets", "open-face", "open-face-helmets"],
      "off-road-motocross": ["off-road-helmets", "motocross-helmet", "off-road-motocross-riding-gear", "off-road"],
      
      // Riding Gear
      "riding-jacket": ["riding-jacket", "motorcycle-jackets", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets"],
      "touring-pants": ["touring-pant", "riding-pants", "riding-pants-below-rs-7000"],
      "riding-jeans": ["riding-jeans"],
      "knee-guard": ["knee-guards-for-bikers", "knee-guard"],
      
      // Main Categories
      "motorcycle-helmets": ["motorcycle-helmets", "helmets"],
      "riding-gear": ["riding-gear", "touring-gear"],
      "motorcycle-riding-gloves": ["riding-gloves-biker-gloves", "riding-gloves", "gloves", "biker-gloves"],
      "riding-gloves-biker-gloves": ["riding-gloves-biker-gloves", "riding-gloves", "gloves", "biker-gloves"],
      "motorcycle-bags": ["motorcycle-bags", "bike-luggage", "luggage"],
      "motorcycle-accessories-bike-accessories": ["motorcycle-accessories", "bike-accessories", "motorcycle-accessories-bike-accessories"],
      
      // Gloves
      "full-gauntlet-gloves": ["full-gauntlet-gloves", "premium-full-gauntlet-riding-gloves", "full-gauntlet-riding-gloves-below-rs-3000"],
      "semi-gauntlet-gloves": ["semi-gauntlet-bike-riding-gloves", "semi-gauntlet", "short-cuff-biker-gloves"],
      
      // Boots
      "short-biking-boots": ["short-biking-boots"],
      "sports-riding-shoes": ["sports-riding-shoes", "sport-riding-shoes", "city-riding-biking-boots"],
      "motocross-boots": ["motocross-boots"],
      
      // Luggage
      "saddle-bags": ["saddle-bags-for-bikes-panniers", "saddle-bags-for-bikes", "panniers", "rynox-saddle-bags"],
      "tank-bags": ["tank-bags", "tank-bags-for-bike", "rynox-tank-bags"],
      "tail-bags": ["tail-bags", "rynox-tail-bags"],
      
      // Accessories
      "bike-phone-holders": ["bike-phone-holders-mobile-holder-for-bike", "mobile-holder-for-bike", "bike-phone-holders"],
      "bike-auxiliary-lights": ["bike-auxiliary-lights"],
      "bike-covers": ["bike-covers"],
      
      // Spares
      "spares": ["bike-spare-parts-online", "performance-parts"],
      "chain-care": ["chain-care", "chain-sprocket-kits"],
      
      // Gadgets
      "communicators": ["communicators"],
      "helmet-accessories": ["helmet-accessories-helmet-visors", "helmet-visors", "balaclava", "helmet-cleaner"]
    };

    let totalUpdated = 0;
    const products = await ProductModel.find({}).select("categorySlugs sku").lean().exec();

    for (const product of products) {
      if (!product.categorySlugs || !Array.isArray(product.categorySlugs)) continue;
      
      const currentSlugs = new Set(product.categorySlugs);
      let changed = false;

      // Reverse map lookup: if DB has a magento slug, add the Frontend slug
      for (const [frontendSlug, magentoSlugs] of Object.entries(frontendToMagento)) {
        for (const magentoSlug of magentoSlugs) {
          if (currentSlugs.has(magentoSlug) && !currentSlugs.has(frontendSlug)) {
            currentSlugs.add(frontendSlug);
            changed = true;
          }
        }
      }
      
      // Special logic: Also catch plural/singular missing links globally
      const additional = new Set<string>();
      for (const slug of currentSlugs) {
        if (slug.endsWith('s')) {
          additional.add(slug.slice(0, -1)); // Add singular
        } else {
          additional.add(slug + 's'); // Add plural
        }
      }
      for (const add of additional) {
        if (!currentSlugs.has(add)) {
          currentSlugs.add(add);
          changed = true;
        }
      }

      if (changed) {
        await ProductModel.updateOne(
          { _id: product._id },
          { $set: { categorySlugs: Array.from(currentSlugs) } }
        );
        totalUpdated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Massive category bridge completed! All Magento tags aligned to Frontend URLs.", 
      totalUpdated 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
