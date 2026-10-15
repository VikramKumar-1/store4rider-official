import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/core/database/connection";
import { ProductModel } from "@/modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const frontendToMagento: Record<string, string[]> = {
      // Helmets
      "modular-helmets": ["modular-helmets", "flip-up-helmets", "smk-glide-modular-helmet"],
      "open-face-helmets": ["open-face-helmets", "half-face-helmets", "open-face"],
      "half-face-helmets": ["half-face-helmets", "open-face", "open-face-helmets"],
      "off-road-motocross": ["off-road-helmets", "motocross-helmet", "off-road-motocross-riding-gear", "off-road"],
      
      // Riding Gear
      "riding-jackets": ["riding-jackets", "riding-jacket", "motorcycle-jackets", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets"],
      "riding-jacket": ["riding-jacket", "riding-jackets", "motorcycle-jackets", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets"],
      "protectors-armour": ["protectors-armour", "protectors", "armour", "armor"],
      "riding-gear-for-women": ["riding-gear-for-women", "women-riding-gear", "riding-gear-women"],
      "women-riding-gear": ["women-riding-gear", "riding-gear-for-women", "riding-gear-women"],
      "touring-pants": ["touring-pant", "riding-pants", "riding-pants-below-rs-7000"],
      "riding-jeans": ["riding-jeans", "motorcycle-riding-jeans"],
      "motorcycle-riding-jeans": ["motorcycle-riding-jeans", "riding-jeans"],
      "knee-guard": ["knee-guards-for-bikers", "knee-guard"],
      "knee-guards-bikers": ["knee-guards-for-bikers", "knee-guard", "knee-guards-bikers"],
      
      // Main Categories
      "motorcycle-helmets": ["motorcycle-helmets", "helmets"],
      "riding-gear": ["riding-gear", "touring-gear"],
      "riding-gloves": ["riding-gloves-biker-gloves", "riding-gloves", "gloves", "biker-gloves"],
      "motorcycle-riding-gloves": ["riding-gloves-biker-gloves", "riding-gloves", "gloves", "biker-gloves"],
      "riding-gloves-biker-gloves": ["riding-gloves-biker-gloves", "riding-gloves", "gloves", "biker-gloves"],
      "motorcycle-bags": ["motorcycle-bags", "bike-luggage", "luggage"],
      "motorcycle-accessories-bike-accessories": ["motorcycle-accessories", "bike-accessories", "motorcycle-accessories-bike-accessories"],
      
      // Gloves
      "full-gauntlet-gloves": ["full-gauntlet-gloves", "premium-full-gauntlet-riding-gloves", "full-gauntlet-riding-gloves-below-rs-3000"],
      "semi-gauntlet-gloves": ["semi-gauntlet-bike-riding-gloves", "semi-gauntlet"],
      "short-motorbike-gloves": ["short-cuff-biker-gloves", "short-cuff-biker-glove"],
      
      // Boots
      "short-biking-boots": ["short-biking-boots"],
      "sports-riding-shoes": ["sports-riding-shoes", "sport-riding-shoes", "city-riding-biking-boots"],
      "motocross-boots": ["motocross-boots"],
      "off-road-riding-boots": ["off-road-boots", "off-road-riding-boots-motocross-boots", "off-road-riding-boots"],
      "off-road-motocross-riding-gear": ["off-road-motocross", "off-road-motocross-riding-gear"],
      
      // Luggage
      "saddle-bags": ["saddle-bags-for-bikes-panniers", "saddle-bags-for-bikes", "panniers", "rynox-saddle-bags"],
      "saddle-bags-bikes": ["saddle-bags-for-bikes-panniers", "saddle-bags-for-bikes", "panniers", "saddle-bags"],
      "tank-bags": ["tank-bags", "tank-bags-for-bike", "rynox-tank-bags"],
      "tank-bags-bikes": ["tank-bags", "tank-bags-for-bike", "rynox-tank-bags", "tank-bags-bikes"],
      "tail-bags": ["tail-bags", "rynox-tail-bags"],
      "motorcycle-tail-bags": ["tail-bags", "motorcycle-tail-bags", "rynox-tail-bags"],
      "bike-top-box": ["top-box", "top-boxes", "bike-top-box"],
      "hydration-bag": ["hydration-bag", "hydration-bags"],
      "motorcycle-other-luggage": ["other-luggage", "other-luggages", "motorcycle-other-luggage"],
      
      // Accessories
      "bike-phone-holders": ["bike-phone-holders-mobile-holder-for-bike", "mobile-holder-for-bike", "bike-phone-holders"],
      "bike-auxiliary-lights": ["bike-auxiliary-lights"],
      "auxiliary-lights": ["bike-auxiliary-lights", "bike-auxiliary-light"],
      "clamps-and-mounts-for-lights": ["bike-auxiliary-light-clamps-and-mounts", "bike-auxiliary-light-clamps-and-mount"],
      "bike-auxiliary-light-clamps-mounts": ["bike-auxiliary-light-clamps-and-mounts", "clamps-and-mounts-for-lights", "bike-auxiliary-light-clamps-mounts"],
      "auxiliary-light-filter": ["auxiliary-light-filter", "auxiliary-light-filters"],
      "auxiliary-light-filters": ["auxiliary-light-filter", "auxiliary-light-filters"],
      "auxiliary-light-wiring-harness-and-switch": ["auxiliary-light-wiring-harness-and-switch"],
      "auxiliary-light-wiring-harness-switch": ["auxiliary-light-wiring-harness-and-switch"],
      "off-beat-accessories": ["off-beat-bike-accessories-online"],
      "off-beat-motorcycle-accessories": ["off-beat-bike-accessories-online", "off-beat-accessories"],
      "rally-tower": ["rally-tower", "rally-towers-navigation-tower"],
      "bike-covers": ["bike-covers"],
      
      // Spares
      "spares": ["bike-spare-parts-online", "performance-parts", "spares", "bike-spares"],
      "bike-spares": ["bike-spare-parts-online", "performance-parts", "spares", "bike-spares"],
      "performance-air-filters": ["performance-air-filters-for-bikes", "performance-air-filters-for-bike"],
      "performance-air-filter-bike": ["performance-air-filters-for-bikes", "performance-air-filters", "performance-air-filter-bike"],
      "chain-care": ["chain-care"],
      "chain-sprocket-kits": ["chain-sprocket-kits"],
      "iridium-spark-plug": ["iridium-spark-plug", "iridium-spark-plugs"],
      "brake-pads": ["brake-pads"],
      
      // Gadgets
      "communicators": ["communicators"],
      "bluetooth-intercoms": ["communicators", "communicator"],
      "helmet-accessories": ["helmet-accessories-helmet-visors", "helmet-visors", "balaclava", "helmet-cleaner"],
      "helmet-visors": ["helmet-accessories-helmet-visors", "helmet-visors", "balaclava", "helmet-cleaner"]
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
