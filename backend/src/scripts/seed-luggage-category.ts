import "dotenv/config";
import mongoose from "mongoose";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

const LUGGAGE_DESC = `<div data-content-type="row" data-appearance="contained" data-element="main"><div data-enable-parallax="0" data-parallax-speed="0.5" data-background-images="{}" data-element="inner" style="justify-content: flex-start; display: flex; flex-direction: column; background-position: left top; background-size: cover; background-repeat: no-repeat; background-attachment: scroll; border-style: none; border-width: 1px; border-radius: 0px; margin: 0px 0px 10px; padding: 10px;"><div data-content-type="html" data-appearance="default" data-element="main" style="border-style: none; border-width: 1px; border-radius: 0px; margin: 0px; padding: 0px;"><h1>Motorcycle Bags &amp; Bike Luggage</h1><p>Carrying luggage on a motorcycle is always an exercise in balance. Put too much weight up high or too far back and the handling changes completely. Pick the wrong bag and you are either wrestling with wet gear after a sudden downpour, or stopping every fifty kilometres to re-cinch loose straps.</p><p>A well-planned luggage setup keeps the weight low, stays rock-solid at highway speeds, and keeps your clothes and electronics bone-dry regardless of the weather. Whether you need a small tank bag for everyday commuting, a pair of rugged saddlebags for a week-long ride through the Western Ghats, or a heavy-duty tail bag for a trip to Spiti or Ladakh, having the right luggage makes all the difference.</p><p>We stock 100% genuine motorcycle luggage from India's leading riding gear and touring brands, including Rynox, Viaterra, Carbonado, Dirtsack, Raida, Shad and Givi. Every product is backed by manufacturer warranty, verified fitment guidance, and fast shipping across India.</p><p>Not sure where to start? Use the sections below to match the bag to how you ride, then check the buying tips and FAQs before you decide.</p><h2>Shop Motorcycle Luggage by Type</h2><h3>Tank Bags for Quick-Access Essentials</h3><p>A tank bag sits right in front of you, so your documents, wallet, phone and tyre pressure gauge are always a glance away. Magnetic mounts work on steel tanks, while strap-based mounts suit plastic or non-magnetic tanks. Compare options in our <a href="/motorcycle-bags-bike-luggage/tank-bags-for-bike" style="color:#0000ff;">Motorcycle Tank Bags</a> section.</p><h3>Tail Bags and Dry Bags for Versatile Capacity</h3><p>A tail bag straps securely across the pillion seat or luggage rack. It keeps the motorcycle's profile narrow, which is ideal for lane filtering and trail riding. Many models feature roll-top closures and welded seams for complete waterproofing. Browse our <a href="/motorcycle-bags-bike-luggage/motorcycle-tail-bags" style="color:#0000ff;">Motorcycle Tail Bags</a> collection.</p><h3>Saddlebags and Panniers for Heavy Touring</h3><p>Saddlebags carry weight on either side of the rear wheel, keeping the centre of gravity low and the bike stable through twisties. Soft saddlebags work well on most bikes without permanent modifications, while hard panniers offer lockable, crush-proof security. See our <a href="/motorcycle-bags-bike-luggage/saddle-bags-for-bikes-panniers" style="color:#0000ff;">Saddlebags and Panniers</a> range.</p><h3>Top Boxes for Lockable Daily Convenience</h3><p>A hard top box mounts to a rear carrier rack and gives you lockable, weather-sealed storage that holds a full-face helmet when you walk away from the bike. They are the most practical luggage option for daily commuting and city errands.</p><h3>Thigh Bags and Hip Packs for Hands-Free Riding</h3><p>Thigh bags strap around your waist and upper leg to keep toll cash, cards, phone and keys within easy reach, without needing to take off your gloves or dig through pockets. Browse our <a href="/motorcycle-bags-bike-luggage/other-luggage" style="color:#0000ff;">Motorcycle Waist and Thigh Bags</a>.</p><h3>Crash Bar Bags and Frame Bags for Unused Space</h3><p>Small bags that mount directly onto engine crash guards or auxiliary sub-frame rails. Perfect for puncture repair kits, tyre inflators, first-aid kits and tools you hope you will not need, but cannot leave behind.</p><h3>Hydration Backpacks for All-Day Saddle Time</h3><p>Drinking water while riding keeps fatigue at bay on hot highway stretches and off-road trails. Hydration backpacks carry 1.5L to 3L bladders with bite valves that slip easily under full-face helmets. Explore our <a href="/motorcycle-bags-bike-luggage/hydration-bags" style="color:#0000ff;">Hydration Packs</a> section.</p><h3>Helmet Bags and Visor Covers for Transport and Storage</h3><p>Protect expensive visors and helmet paint from scratches, dust and accidental drops when carrying your helmet off the motorcycle or storing it during the off-season. See our <a href="/motorcycle-bags-bike-luggage/other-luggage" style="color:#0000ff;">Helmet Bags and Visor Cases</a>.</p><h2>How to Choose the Right Motorcycle Luggage Setup</h2><ul><li><strong>Commuting and short day rides:</strong> A tank bag (10L–15L) or a thigh bag gives you quick access to essentials without making the bike feel heavy or wide.</li><li><strong>Weekend trips (2 to 3 days):</strong> A single 30L–45L tail bag or a medium top box gives you enough room for a change of clothes, basic tools and rain gear.</li><li><strong>Long-distance touring (5+ days):</strong> A combination setup works best: a pair of saddlebags (40L–60L total) for heavy items, a tail bag (30L–40L) for lightweight bulk, and a tank bag for electronics and documents.</li><li><strong>Off-road and adventure trail riding:</strong> Keep it soft and narrow. Avoid hard metal boxes that can cause leg injuries in a drop. Choose rackless soft saddlebags and roll-top dry duffles with universal webbed lash points.</li></ul><p>For more touring advice, our guide on <a href="/guides/post/items-to-carry-on-long-motorcycle-tour" style="color:#0000ff;">items to carry on a long motorcycle tour</a> helps you decide what goes where, and the tips on <a href="/guides/post/stay-dry-while-riding-motorcycle-in-rains" style="color:#0000ff;">staying dry while riding in the rain</a> are worth a read before the monsoon.</p></div></div></div>`;

const LUGGAGE_FAQS = [
  {
    question: "What type of luggage is best for long-distance touring on a motorcycle?",
    answer: "A pair of saddlebags plus a tail bag or top box works best for most multi-day trips. Put heavier items in the saddlebags to keep the centre of gravity low, and use the tail bag for lighter bulk such as clothes. Our guide on <a href=\"/guides/post/items-to-carry-on-long-motorcycle-tour\" class=\"text-brand hover:underline font-semibold\">essential items to carry on a long motorcycle tour</a> covers packing in more detail."
  },
  {
    question: "Are motorcycle saddlebags universal, or do they fit specific bikes?",
    answer: "Most soft saddlebags use universal straps that fit a wide range of motorcycles. If your bike has a high, upswept exhaust, you may need saddle stays or a heat shield so the bag material does not get damaged."
  },
  {
    question: "How do I keep my luggage dry in the rain?",
    answer: "Look for roll-top closures, welded waterproof liners or waterproof fabrics. A separate rain cover adds protection in heavy downpours, and packing electronics and documents in a dry bag inside your luggage is a good habit."
  },
  {
    question: "Can I install a top box on any motorcycle?",
    answer: "A top box needs a rear rack or mounting plate fitted to the bike first, either model-specific or universal. Once that is in place, the box clicks on with a quick-release lock."
  },
  {
    question: "Do I need a crash guard to use a crash bar bag?",
    answer: "Yes. Crash bar bags strap onto the crash guard or engine guard bars, so your bike needs one fitted. Check the bar diameter against the bag's strap length, and make sure the bag sits clear of the exhaust, footpeg and gear lever once it is loaded."
  },
  {
    question: "Where should I keep my phone and wallet while riding?",
    answer: "A tank bag or a thigh bag keeps them reachable without stopping to unpack. A thigh bag is handy at toll plazas and fuel stops, while a tank bag with a clear map pocket also works well for navigation."
  }
];

const META_TITLE = "Motorcycle Bags & Bike Luggage Online | Store4Riders";
const META_DESC = "Shop motorcycle bags and bike luggage online. Compare tank bags, saddlebags, tail bags, top boxes, crash bar bags, thigh bags, helmet bags and hydration packs.";

async function seedLuggageCategory() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI or DATABASE_URL is not defined in environment");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully!");

  const targetCategory = await CategoryModel.findOne({ slug: "motorcycle-bags-bike-luggage" });
  if (!targetCategory) {
    throw new Error("Category with slug 'motorcycle-bags-bike-luggage' not found in database!");
  }

  console.log(`Found category: ${targetCategory.name} (_id: ${targetCategory._id})`);

  // Update description, faqs, metaTitle, metaDescription
  targetCategory.description = LUGGAGE_DESC;
  targetCategory.faqs = LUGGAGE_FAQS as any;
  targetCategory.metaTitle = META_TITLE;
  targetCategory.metaDescription = META_DESC;

  await targetCategory.save();
  console.log("✅ Successfully updated 'motorcycle-bags-bike-luggage' category with description and 6 FAQs!");

  // Invalidate Redis Cache
  try {
    await CategoryService.invalidateCache();
    console.log("✅ Successfully invalidated Category Redis cache!");
  } catch (err) {
    console.warn("⚠️ Could not invalidate Redis cache:", err);
  }

  // Verify updated document
  const updated = await CategoryModel.findOne({ slug: "motorcycle-bags-bike-luggage" }).lean();
  console.log("Verification:");
  console.log("- Name:", updated?.name);
  console.log("- Slug:", updated?.slug);
  console.log("- Description Length:", updated?.description?.length);
  console.log("- FAQs Count:", updated?.faqs?.length);
  console.log("- Meta Title:", updated?.metaTitle);

  await mongoose.disconnect();
  console.log("Done!");
  process.exit(0);
}

seedLuggageCategory().catch((err) => {
  console.error("❌ Error seeding luggage category:", err);
  process.exit(1);
});
