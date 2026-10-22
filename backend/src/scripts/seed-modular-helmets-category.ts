import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import mongoose from "mongoose";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

const MODULAR_DESC = `<div data-content-type="row" data-appearance="contained" data-element="main"><div data-enable-parallax="0" data-parallax-speed="0.5" data-background-images="{}" data-element="inner" style="justify-content: flex-start; display: flex; flex-direction: column; background-position: left top; background-size: cover; background-repeat: no-repeat; background-attachment: scroll; border-style: none; border-width: 1px; border-radius: 0px; margin: 0px 0px 10px; padding: 10px;"><div data-content-type="html" data-appearance="default" data-element="main" style="border-style: none; border-width: 1px; border-radius: 0px; margin: 0px; padding: 0px;"><h1>Modular (Flip-Up) Motorcycle Helmets</h1><p>Modular helmets solve a very specific problem: you want full-face protection on the road, but you don't want to take your whole helmet off every time you stop for directions, a toll booth, or a chai break. The chin bar flips up in one motion, giving you open-face convenience without switching helmets. This is why modular helmets are often called flip-up helmets, and it's what makes them a favorite among touring riders and long-distance commuters who spend hours in the helmet and need it to adapt without a fuss.</p><p>Since you'll be wearing it for long stretches, it's worth getting the size right: our <a href="/guides/post/choosing-a-properly-fitting-helmet" style="color:#0000ff;">helmet fitting guide</a> explains how to measure and what a proper fit should feel like. If maximum protection matters more than the flip-up feature, compare these against our <a href="/motorcycle-helmets/full-face-helmets" style="color:#0000ff;">full-face helmets</a>, or browse the full <a href="/motorcycle-helmets" style="color:#0000ff;">motorcycle helmets collection</a>.</p><ul><li><strong>Two helmets in one:</strong> Full-face protection on the move, open-face convenience when you stop.</li><li><strong>Built for long rides:</strong> Extra ventilation and cushioned liners for hours in the saddle.</li><li><strong>Quick-flip chin bar:</strong> One-handed operation, even with gloves on.</li><li><strong>Certified safety:</strong> ECE, DOT and BIS certified models, tested in both locked and flipped positions.</li></ul></div></div></div>`;

const MODULAR_FAQS = [
  {
    question: "Are modular helmets as safe as full-face helmets?",
    answer: "When the chin bar is locked down, a certified modular helmet offers protection close to a full-face helmet. The chin bar hinge does add a small amount of complexity compared to a one-piece shell, so always check that the specific model carries a valid safety certification for the locked position."
  },
  {
    question: "Can I ride with the chin bar flipped up?",
    answer: "You can, but you shouldn't at speed. Riding with the bar up removes chin and jaw protection entirely, so it's best used only when stationary, such as at a toll booth or while parking."
  },
  {
    question: "Are modular helmets a good choice for touring?",
    answer: "Yes, this is exactly what they're designed for. The ability to flip the chin bar up during long stops, combined with better ventilation than most full-face helmets, makes them popular for multi-day rides."
  },
  {
    question: "How do I maintain the flip-up mechanism?",
    answer: "Keep the hinge area clean and free of dust, and check periodically that the locking mechanism clicks firmly into place when you close the chin bar. If it ever feels loose or doesn't lock securely, stop using the helmet until it's checked. Our <a href=\"/guides/post/helmet-maintenance-guide\" class=\"text-brand hover:underline font-semibold\">helmet maintenance guide</a> has more detail on cleaning moving parts like this without damaging them."
  },
  {
    question: "Are modular helmets heavier than full-face helmets?",
    answer: "Slightly, yes. The hinge and locking mechanism add some weight compared to a one-piece full-face shell. Most riders don't notice this on regular rides, but it's worth trying one on if neck comfort on long trips is a concern for you."
  }
];

const META_TITLE = "Modular (Flip-Up) Motorcycle Helmets | Store4Riders";
const META_DESC = "Shop modular and flip-up motorcycle helmets online at Store4Riders. BIS, ECE and DOT certified modular helmets with quick-flip chin bars, sun visors and fast delivery across India.";

async function seedModularHelmets() {
  if (!MONGODB_URI) throw new Error("No MONGODB_URI");
  await mongoose.connect(MONGODB_URI);

  const categories = await CategoryModel.find({
    $or: [
      { slug: "modular-helmets" },
      { slug: "modular-helmets-flip-up-helmets" },
      { slug: "modular-helmet" },
      { name: /modular/i }
    ]
  });

  console.log(`Found ${categories.length} matching categories for modular helmets:`);
  for (const c of categories) {
    console.log(`- ${c.name} (slug: ${c.slug}, _id: ${c._id})`);
  }

  let cat = categories.find(c => c.slug === "modular-helmets") || categories[0];
  if (!cat) {
    console.log("Creating modular-helmets category...");
    cat = new CategoryModel({
      name: "Modular Helmets",
      slug: "modular-helmets",
      includeInMenu: true,
      parentId: "6ac0f83bed338a8e53f2bef5"
    });
  }

  cat.slug = "modular-helmets";
  cat.description = MODULAR_DESC;
  cat.faqs = MODULAR_FAQS as any;
  cat.metaTitle = META_TITLE;
  cat.metaDescription = META_DESC;

  await cat.save();
  console.log("✅ Modular helmets category updated successfully!");

  // If there's also 'modular-helmets-flip-up-helmets', update it as well
  const altCat = categories.find(c => c.slug === "modular-helmets-flip-up-helmets" && String(c._id) !== String(cat._id));
  if (altCat) {
    altCat.description = MODULAR_DESC;
    altCat.faqs = MODULAR_FAQS as any;
    altCat.metaTitle = META_TITLE;
    altCat.metaDescription = META_DESC;
    await altCat.save();
    console.log("✅ Updated alternative category modular-helmets-flip-up-helmets as well!");
  }

  try {
    await CategoryService.invalidateCache();
    console.log("✅ Invalidated Category Redis cache.");
  } catch (e) {
    console.warn("Cache invalidate warning:", e);
  }

  await mongoose.disconnect();
}

seedModularHelmets().catch(err => {
  console.error("Error seeding modular helmets:", err);
  process.exit(1);
});
