import "dotenv/config";
import mongoose from "mongoose";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

const RIDING_GEAR_DESC = `<div data-content-type="row" data-appearance="contained" data-element="main"><div data-enable-parallax="0" data-parallax-speed="0.5" data-background-images="{}" data-element="inner" style="justify-content: flex-start; display: flex; flex-direction: column; background-position: left top; background-size: cover; background-repeat: no-repeat; background-attachment: scroll; border-style: none; border-width: 1px; border-radius: 0px; margin: 0px 0px 10px; padding: 10px;"><div data-content-type="html" data-appearance="default" data-element="main" style="border-style: none; border-width: 1px; border-radius: 0px; margin: 0px; padding: 0px;"><h1>Riding Gear</h1><p>Most crashes are survivable. Most road rash is not. Riding gear exists to close that gap, and a proper kit covers you from your head to your feet, not just the parts that feel most exposed.</p><p>The idea behind ATGATT (All The Gear, All The Time) is simple. You don't get to choose which part of you hits the road first, so every part needs the same level of protection, every time you ride, whether it's a five minute commute or a five day tour.</p><p>We stock riding gear across every category a rider actually needs: helmets, jackets, pants, gloves, boots, and gear built specifically for off-road and racing use. All genuine products from established brands, with warranty and fast delivery across India. EMI is available at checkout on eligible orders.</p><h2>Shop Riding Gear by Category</h2><ul><li><strong><a href="/motorcycle-helmets">Motorcycle Helmets</a>:</strong> Full-face, modular, open-face and off-road helmets, all BIS certified with several ECE and DOT certified options.</li> <li><strong><a href="/riding-gear/riding-jackets">Riding Jackets</a>:</strong> Commuter to touring jackets with CE armour, sorted by price bracket so you can shop by budget.</li> <li><strong><a href="/riding-gear/riding-pants">Riding Pants</a>:</strong> Riding jeans, mesh touring pants and standalone knee guards with removable armour.</li> <li><strong><a href="/riding-gear/riding-gloves">Riding Gloves</a>:</strong> Full gauntlet, semi gauntlet and short gloves in leather and textile.</li> <li><strong><a href="/riding-gear/motorcycle-riding-boots">Motorcycle Riding Boots</a>:</strong> City boots, touring boots and off-road boots with reinforced ankle protection.</li> <li><strong><a href="/riding-gear/off-road-motocross-riding-gear">Off-Road / Motocross Riding Gear</a>:</strong> Gear built for trail riding and motocross, from jerseys to goggles.</li> <li><strong><a href="/riding-gear/motorcycle-racing-suit">Racing Suits</a>:</strong> Track-focused protective gear for serious speed.</li></ul><h2>Building a Complete Riding Kit</h2><p>If you're starting from scratch, a helmet and a jacket with armour are the two non-negotiables. Everything else can be added over time, but those two protect the areas most likely to be seriously injured in a fall.</p><p>A full ATGATT kit, helmet, jacket, pants, gloves and boots, typically runs anywhere from Rs.15,000 for a solid entry-level setup to well over Rs.50,000 once you move into premium touring gear. Buying it in stages rather than all at once is common, and completely fine. The order most riders follow is helmet first, jacket second, then gloves, boots and pants as budget allows.</p><p>Riding gear also isn't one-size-fits-all in the way regular clothing sometimes is. Armour needs to sit over your actual joints, not just look like it fits, so it's worth checking the size chart on each product page rather than assuming your usual size carries over.</p></div></div></div>`;

const RIDING_GEAR_FAQS = [
  {
    question: "What's the minimum riding gear I should never skip?",
    answer: "A certified helmet is the one piece of gear you should never ride without, since head injuries are the leading cause of death in motorcycle accidents. After that, a jacket with CE armour at the shoulders and elbows offers the next biggest protection gain for the money."
  },
  {
    question: "Do I need different gear for city riding versus touring?",
    answer: "City riding gear can prioritise ventilation and lighter armour since speeds and impact forces are generally lower, while touring gear needs to handle sustained highway speeds, weather changes, and longer hours in the saddle. Many riders start with versatile gear that handles both reasonably well before investing in dedicated touring pieces."
  },
  {
    question: "How much should a complete riding kit cost?",
    answer: "A functional entry-level kit covering helmet, jacket, gloves and boots typically starts around Rs.15,000 to Rs.20,000, while a premium touring setup with higher CE ratings and better weatherproofing can run Rs.50,000 or more. Building the kit in stages, starting with the helmet and jacket, is a practical way to spread the cost."
  },
  {
    question: "Is it necessary to buy gear from the same brand?",
    answer: "No, mixing brands across your helmet, jacket, pants, gloves and boots is completely normal and most riders do exactly that. What matters more is that each piece fits correctly and carries the appropriate certification for its category."
  }
];

const META_TITLE = "Motorcycle Riding Gear Online: Helmets to Boots | Store4Riders";
const META_DESC = "Shop complete motorcycle riding gear online, including jackets, pants, gloves and boots from top brands. Genuine products with warranty, fast delivery and EMI across India.";

async function seedRidingGearCategory() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI or DATABASE_URL is not defined in environment");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully!");

  const targetCategory = await CategoryModel.findOne({ slug: "riding-gear" });
  if (!targetCategory) {
    throw new Error("Category with slug 'riding-gear' not found in database!");
  }

  console.log(`Found category: ${targetCategory.name} (_id: ${targetCategory._id})`);

  // Update description, faqs, metaTitle, metaDescription
  targetCategory.description = RIDING_GEAR_DESC;
  targetCategory.faqs = RIDING_GEAR_FAQS as any;
  targetCategory.metaTitle = META_TITLE;
  targetCategory.metaDescription = META_DESC;

  await targetCategory.save();
  console.log("✅ Successfully updated 'riding-gear' category with description and 4 FAQs!");

  // Invalidate Redis Cache
  try {
    await CategoryService.invalidateCache();
    console.log("✅ Successfully invalidated Category Redis cache!");
  } catch (err) {
    console.warn("⚠️ Could not invalidate Redis cache (redis might be offline or disabled):", err);
  }

  // Verify updated document
  const updated = await CategoryModel.findOne({ slug: "riding-gear" }).lean();
  console.log("Verification:");
  console.log("- Name:", updated?.name);
  console.log("- Slug:", updated?.slug);
  console.log("- Description Length:", updated?.description?.length);
  console.log("- FAQs Count:", updated?.faqs?.length);
  console.log("- Meta Title:", updated?.metaTitle);

  await mongoose.disconnect();
  console.log("Done!");
}

seedRidingGearCategory().catch((err) => {
  console.error("❌ Error seeding riding-gear category:", err);
  process.exit(1);
});
