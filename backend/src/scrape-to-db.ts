import mongoose from 'mongoose';
import * as cheerio from 'cheerio';
import { deleteCache } from './core/cache/redis.js';

const MONGODB_URI = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  faqs: [faqSchema]
}, { strict: false });

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

async function scrapeAndUpdateDB() {
  const url = 'https://www.store4riders.com/motorcycle-helmets.html';
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected. Fetching ${url}...`);
  
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Get the HTML of the category description
    const descContainer = $('.category-description');
    let rawHtml = descContainer.html() || '';
    
    // We will parse the text to find FAQs
    const textContent = descContainer.text() || '';
    const faqRegex = /Q\d+:\s*(.+?)\s*A\d+:\s*([\s\S]+?)(?=\s*Q\d+:|$)/g;
    const faqs: any[] = [];
    let match;
    
    while ((match = faqRegex.exec(textContent)) !== null) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim()
      });
    }

    console.log(`Found ${faqs.length} FAQs!`);

    let cleanDescriptionHtml = rawHtml;
    // Look for <h3>FAQs</h3> or <h2>FAQs</h2>
    const splitIndex = rawHtml.indexOf('<h3>FAQs</h3>');
    if (splitIndex !== -1) {
      cleanDescriptionHtml = rawHtml.substring(0, splitIndex);
    } else {
      const splitIndex2 = rawHtml.indexOf('<h2>FAQs</h2>');
      if (splitIndex2 !== -1) {
        cleanDescriptionHtml = rawHtml.substring(0, splitIndex2);
      }
    }

    let bannerImage = 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=1200&q=80'; // Fallback
    const imgMatch = html.match(/<img[^>]*category-image[^>]*src="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      bannerImage = imgMatch[1];
    }

    console.log(`Updating category 'helmets' in MongoDB (UPSERT)...`);
    const result = await Category.updateOne(
      { slug: 'helmets' },
      { 
        $set: { 
          name: "Motorcycle Helmets",
          slug: "helmets",
          bannerImage: bannerImage,
          description: cleanDescriptionHtml.trim(),
          faqs: faqs 
        } 
      },
      { upsert: true }
    );
    console.log("MongoDB Update Result:", result);

    // Clear cache
    console.log("Clearing Redis Cache...");
    await deleteCache('category_tree');
    
    console.log("Success! Data is now in the database and cache is cleared.");

  } catch (error) {
    console.error('Error scraping:', error);
  } finally {
    mongoose.disconnect();
  }
}

scrapeAndUpdateDB();
