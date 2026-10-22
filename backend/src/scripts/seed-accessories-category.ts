import dotenv from "dotenv";
dotenv.config({ path: "backend/.env" });
import mongoose from "mongoose";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

const ACCESSORIES_DESC = `<div data-content-type="row" data-appearance="contained" data-element="main"><div data-enable-parallax="0" data-parallax-speed="0.5" data-background-images="{}" data-element="inner" style="justify-content: flex-start; display: flex; flex-direction: column; background-position: left top; background-size: cover; background-repeat: no-repeat; background-attachment: scroll; border-style: none; border-width: 1px; border-radius: 0px; margin: 0px 0px 10px; padding: 10px;"><div data-content-type="html" data-appearance="default" data-element="main" style="border-style: none; border-width: 1px; border-radius: 0px; margin: 0px; padding: 0px;"><h1>Bike Accessories Online</h1><p>Shop wide range of motorcycle accessories online in India at Store4Riders.com. Frame sliders, crash bobbins, tail tidy kits, swingarm sliders, swingarm spools, radiator guard from top brands in India. All Bike Accessories are sold with manufacturer warranty.</p></div></div></div>`;

const META_TITLE = "Bike Accessories Online | Store4Riders";
const META_DESC = "Shop wide range of motorcycle accessories online in India at Store4Riders.com. Frame sliders, crash bobbins, tail tidy kits, swingarm sliders, swingarm spools, radiator guard from top brands in India. All Bike Accessories are sold with manufacturer warranty.";

async function seed() {
  if (!MONGODB_URI) throw new Error("No MONGODB_URI");
  await mongoose.connect(MONGODB_URI);

  let cat = await CategoryModel.findOne({
    $or: [
      { slug: "motorcycle-accessories-online" },
      { slug: "motorcycle-accessories-bike-accessories" },
      { _id: new mongoose.Types.ObjectId("6ac49c26ed338a8e53f2e841") }
    ]
  });

  if (!cat) {
    throw new Error("Category 6ac49c26ed338a8e53f2e841 not found");
  }

  console.log(`Found category: ${cat.name} (${cat.slug}) id: ${cat._id}`);

  cat.slug = "motorcycle-accessories-online";
  cat.description = ACCESSORIES_DESC;
  cat.metaTitle = META_TITLE;
  cat.metaDescription = META_DESC;

  await cat.save();
  console.log("✅ Category updated successfully with description and slug!");

  try {
    await CategoryService.invalidateCache();
  } catch (e) {
    console.warn("Cache invalidate warning:", e);
  }

  await mongoose.disconnect();
}

seed().catch(console.error);
