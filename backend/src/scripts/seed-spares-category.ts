import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
import mongoose from "mongoose";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

const SPARES_DESC = `<div data-content-type="row" data-appearance="contained" data-element="main"><div data-enable-parallax="0" data-parallax-speed="0.5" data-background-images="{}" data-element="inner" style="justify-content: flex-start; display: flex; flex-direction: column; background-position: left top; background-size: cover; background-repeat: no-repeat; background-attachment: scroll; border-style: none; border-width: 1px; border-radius: 0px; margin: 0px 0px 10px; padding: 10px;"><div data-content-type="html" data-appearance="default" data-element="main" style="border-style: none; border-width: 1px; border-radius: 0px; margin: 0px; padding: 0px;"><h1>Bike Spare Parts Online</h1><p>Finding the right motorcycle spare parts shouldn’t mean guessing whether a listing actually fits your bike. Every part on this page is organized by category first, then filtered down to your exact model, so you’re not scrolling through parts built for a different engine or a different year.</p><p>We stock the parts that wear out and need replacing on a normal riding schedule: chain and sprocket kits, spark plugs, air filters, brake pads, and more. All of it is sourced from established brands rather than unbranded generics, because a spare part is one place where cutting corners tends to cost more later, not less.</p><p>Whether you’re doing routine maintenance or replacing something that’s finally given out, start with the category that matches what you need below.</p><ul><li><strong>Genuine, OEM-grade parts:</strong> Sourced from established brands, not unbranded substitutes.</li><li><strong>Filtered by your exact model:</strong> Every category narrows down to your bike’s make, model and year.</li><li><strong>Wide range, one place:</strong> Chain sprocket kits, spark plugs, air filters, brake pads and more.</li><li><strong>Fast delivery, easy EMI:</strong> Quick shipping across India with EMI available on eligible orders.</li></ul><h2>Shop Spare Parts by Category</h2><ul><li><a href="/bike-spares/chain-sprocket-kits" style="color:#0000ff;">Chain &amp; Sprocket Kits</a>: Matched chain and sprocket sets sized for your bike’s exact pitch and tooth count.</li><li><a href="/bike-spares/iridium-spark-plug" style="color:#0000ff;">Iridium Spark Plugs</a>: Longer-lasting plugs for smoother idling and better throttle response.</li><li><a href="/bike-spares/performance-air-filter-bike" style="color:#0000ff;">Performance Air Filters</a>: Stock replacements and high-flow upgrades, filtered by model.</li><li><a href="/bike-spares/brake-pads" style="color:#0000ff;">Brake Pads</a>: Ceramic and semi-metallic pads built for consistent stopping power.</li></ul><h2>How to Find the Right Part for Your Bike</h2><p>The fastest way to avoid ordering the wrong part is to filter by your bike’s make, model and year before browsing, rather than searching by part name alone. Most listings also show the OEM part number where available, which is worth cross-checking against your bike’s manual or the part currently fitted if you’re ever unsure. If a part comes in multiple variants, such as a spark plug with different heat ranges or a chain kit with different pitch options, stick to the specification your manufacturer recommends unless you have a specific reason to change it.</p></div></div></div>`;

const SPARES_FAQS = [
  {
    question: "Are the spare parts on this site genuine or aftermarket?",
    answer: "We stock parts from established manufacturers like NGK, Rolon, BMC and K&N rather than unbranded generic parts. Some are OEM parts fitted at the factory, and others are recognized aftermarket brands, but all are sourced through official channels."
  },
  {
    question: "How do I know a spare part will fit my bike?",
    answer: "Filter by your bike’s make, model and year within each category, which narrows the listings down to parts confirmed to fit. If you’re still unsure, the OEM part number listed on most products can be checked against your bike’s manual or the part currently installed."
  },
  {
    question: "Do you offer genuine OEM parts or only performance upgrades?",
    answer: "Both. Categories like spark plugs and chain sprocket kits include standard OEM-spec replacements alongside performance options, so you can choose based on whether you’re doing routine maintenance or looking for an upgrade."
  },
  {
    question: "Is EMI or cash on delivery available for spare parts orders?",
    answer: "EMI is available on eligible orders at checkout, and cash on delivery is offered depending on your location and order value. Availability is shown at checkout based on the specific items in your cart."
  },
  {
    question: "How long does delivery take for motorcycle spare parts?",
    answer: "Delivery timelines vary by location, but most orders across India are dispatched quickly and arrive within a few business days. Exact delivery estimates are shown at checkout once you enter your pincode."
  }
];

const META_TITLE = "Bike Spare Parts Online: Genuine Motorcycle Parts | Store4Riders";
const META_DESC = "Shop genuine bike spare parts online in India at Store4Riders. Chain and sprocket kits, iridium spark plugs, performance air filters, ceramic brake pads and more with fast delivery.";

async function seedSparesCategory() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Find all categories related to spares
  const categories = await CategoryModel.find({
    $or: [
      { slug: "bike-spares" },
      { slug: "spares" },
      { slug: "bike-spare-parts-online" },
      { name: /spare/i }
    ]
  });

  console.log(`Found ${categories.length} matching categories:`);
  for (const c of categories) {
    console.log(`- ${c.name} (slug: ${c.slug}, _id: ${c._id}, parentId: ${c.parentId})`);
  }

  // Find the root spares category or one with slug 'bike-spares' / 'spares' / 'bike-spare-parts-online'
  let targetCategory = 
    categories.find(c => c.slug === "bike-spares") || 
    categories.find(c => c.slug === "spares") || 
    categories.find(c => c.slug === "bike-spare-parts-online") || 
    categories.find(c => !c.parentId) || 
    categories[0];

  if (!targetCategory) {
    console.log("Creating new 'bike-spares' category...");
    targetCategory = new CategoryModel({
      name: "Bike Spares",
      slug: "bike-spares",
      includeInMenu: true,
    });
  }

  console.log(`Updating category: ${targetCategory.name} (_id: ${targetCategory._id}, current slug: ${targetCategory.slug})...`);
  targetCategory.slug = "bike-spares";
  targetCategory.description = SPARES_DESC;
  targetCategory.faqs = SPARES_FAQS as any;
  targetCategory.metaTitle = META_TITLE;
  targetCategory.metaDescription = META_DESC;

  await targetCategory.save();
  console.log("✅ Category updated successfully with description, 5 FAQs, and metadata!");

  try {
    await CategoryService.invalidateCache();
    console.log("✅ Invalidated Category Redis cache.");
  } catch (e) {
    console.warn("Cache invalidate warning:", e);
  }

  await mongoose.disconnect();
}

seedSparesCategory().catch(err => {
  console.error("Error seeding spares:", err);
  process.exit(1);
});
