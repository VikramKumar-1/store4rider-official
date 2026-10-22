import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
import mongoose from "mongoose";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

const GADGETS_DESC = `<div data-content-type="row" data-appearance="contained" data-element="main"><div data-enable-parallax="0" data-parallax-speed="0.5" data-background-images="{}" data-element="inner" style="justify-content: flex-start; display: flex; flex-direction: column; background-position: left top; background-size: cover; background-repeat: no-repeat; background-attachment: scroll; border-style: none; border-width: 1px; border-radius: 0px; margin: 0px 0px 10px; padding: 10px;"><div data-content-type="html" data-appearance="default" data-element="main" style="border-style: none; border-width: 1px; border-radius: 0px; margin: 0px; padding: 0px;"><h1>Bike Gadgets Online</h1><p>Riding gear has moved well past helmets and jackets. A good set of bike gadgets can change how you actually ride: navigation you can see at a glance instead of pulling over to check, or a way to talk to your riding group without shouting over wind noise at 80 kilometers an hour.</p><p>We keep this section focused on gadgets that solve a real problem on the road, not gimmicks. Whether you need somewhere secure to mount your phone or a way to stay connected with the rider next to you, start with the category that matches what you’re after below.</p><ul><li><strong>Built for the road:</strong> Every gadget here is chosen for actual riding conditions, not general consumer use.</li><li><strong>Wide category range:</strong> Phone holders, helmet communicators, and more, all in one place.</li><li><strong>Trusted brands:</strong> Established names rather than unverified generic imports.</li><li><strong>Fast delivery:</strong> Quick shipping across India.</li></ul><h2>Shop Gadgets by Category</h2><ul><li><a href="/gadgets/bike-phone-holders" style="color:#0000ff;">Bike Phone Holders</a>: Clamps and waterproof mounts to keep your phone secure and visible while riding.</li><li><a href="/gadgets/communicators" style="color:#0000ff;">Communicators</a>: Helmet intercoms and Bluetooth headsets for staying connected with your riding group.</li></ul></div></div></div>`;

const GADGETS_FAQS = [
  {
    question: "What kind of gadgets does Store4Riders stock for motorcycles?",
    answer: "The range currently covers bike phone holders, including waterproof and vibration-damped options, and helmet communicators ranging from standard Bluetooth pairing to mesh intercom systems for larger groups. Each category page goes into detail on choosing the right option for how you ride."
  },
  {
    question: "Are these gadgets compatible with any motorcycle, or do I need to check fitment?",
    answer: "Phone holders generally mount using adjustable clamps that fit a range of handlebar diameters, so most fit without issue, though it’s worth checking the specific product listing for exact compatibility. Helmet communicators typically attach to the outside of most full-face and modular helmets using an adhesive or clip-on base, independent of your bike model."
  },
  {
    question: "Do you sell genuine products or unbranded imports?",
    answer: "Everything stocked here comes from established brands sourced through official channels, not unbranded generic imports. Brand and model details are listed clearly on each product page."
  },
  {
    question: "Can I return a gadget if it doesn’t work as expected?",
    answer: "Returns are handled according to our standard return policy, which covers manufacturing defects and issues within the return window. Check the product page or contact support for the specific timeline and conditions that apply to your order."
  },
  {
    question: "What’s the best gadget to start with if I’m new to adding accessories to my bike?",
    answer: "A phone holder is usually the most practical first addition, since navigation is something almost every rider needs regardless of how or where they ride. From there, a helmet communicator is worth considering if you regularly ride with a group or want hands-free calls and navigation audio."
  }
];

const META_TITLE = "Bike Gadgets Online: Phone Holders, Intercoms & More | Store4Riders";
const META_DESC = "Shop bike gadgets online in India at Store4Riders. Browse bike phone holders, helmet Bluetooth communicators, intercoms and more with warranty and express delivery.";

async function seedGadgetsCategory() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all categories related to gadgets
  const categories = await CategoryModel.find({
    $or: [
      { slug: "gadgets" },
      { slug: "gadget" },
      { name: /gadget/i }
    ]
  });

  console.log(`Found ${categories.length} matching categories:`);
  for (const c of categories) {
    console.log(`- ${c.name} (slug: ${c.slug}, _id: ${c._id}, parentId: ${c.parentId})`);
  }

  // Find the root gadgets category or one with slug 'gadgets'
  let targetCategory = categories.find(c => c.slug === "gadgets") || categories.find(c => !c.parentId) || categories[0];

  if (!targetCategory) {
    console.log("Creating new 'gadgets' category...");
    targetCategory = new CategoryModel({
      name: "Gadgets",
      slug: "gadgets",
      includeInMenu: true,
    });
  }

  console.log(`Updating category: ${targetCategory.name} (_id: ${targetCategory._id})...`);
  targetCategory.slug = "gadgets";
  targetCategory.description = GADGETS_DESC;
  targetCategory.faqs = GADGETS_FAQS as any;
  targetCategory.metaTitle = META_TITLE;
  targetCategory.metaDescription = META_DESC;

  await targetCategory.save();
  console.log("✅ Category updated successfully with description, 5 FAQs, and metadata!");

  try {
    await CategoryService.invalidateCache();
    console.log("✅ Invalidated Redis cache.");
  } catch (e) {
    console.warn("Cache invalidate warning:", e);
  }

  await mongoose.disconnect();
}

seedGadgetsCategory().catch(err => {
  console.error("Error seeding gadgets:", err);
  process.exit(1);
});
