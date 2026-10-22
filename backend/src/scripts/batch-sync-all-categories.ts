import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import * as cheerio from "cheerio";
import { CategoryModel } from "../modules/category/category.model";
import { CategoryService } from "../modules/category/category.service";

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

// List of all storefront category paths from navigation & sitemap
const CATEGORY_PATHS = [
  // Helmets
  "/motorcycle-helmets/open-face-helmets",
  "/motorcycle-helmets/off-road-helmets",
  "/motorcycle-helmets/helmet-accessories",
  "/motorcycle-helmets/balaclava",
  "/motorcycle-helmets/bluetooth-intercoms",
  "/motorcycle-helmets/helmet-cleaners",

  // Riding Gear
  "/riding-gear/riding-jackets",
  "/riding-gear/riding-jackets/protectors-armour",
  "/riding-gear/riding-pants",
  "/riding-gear/riding-pants/motorcycle-riding-jeans",
  "/riding-gear/riding-pants/touring-pants",
  "/riding-gear/riding-pants/knee-guards-bikers",
  "/riding-gear/riding-gloves",
  "/riding-gear/riding-gloves/full-gauntlet-gloves",
  "/riding-gear/riding-gloves/semi-gauntlet-gloves",
  "/riding-gear/riding-gloves/short-motorbike-gloves",
  "/riding-gear/motorcycle-riding-boots",
  "/riding-gear/motorcycle-riding-boots/short-biking-boots",
  "/riding-gear/motorcycle-riding-boots/sports-riding-shoes",
  "/riding-gear/motorcycle-riding-boots/off-road-riding-boots",
  "/riding-gear-for-women",
  "/riding-gear/off-road-motocross-riding-gear",

  // Luggage
  "/motorcycle-bags-bike-luggage/tank-bags-bikes",
  "/motorcycle-bags-bike-luggage/saddle-bags-bikes",
  "/motorcycle-bags-bike-luggage/motorcycle-tail-bags",
  "/motorcycle-bags-bike-luggage/bike-top-box",
  "/motorcycle-bags-bike-luggage/hydration-bag",
  "/motorcycle-bags-bike-luggage/motorcycle-other-luggage",

  // Accessories
  "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers",
  "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/bike-auxiliary-lights",
  "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/auxiliary-light-filters",
  "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/bike-auxiliary-light-clamps-mounts",
  "/motorcycle-accessories-online/bike-auxiliary-lights-filters-flashers/auxiliary-light-wiring-harness-switch",
  "/motorcycle-accessories-online/off-beat-motorcycle-accessories",
  "/motorcycle-accessories-online/performance-parts",
  "/motorcycle-accessories-online/rally-tower",
  "/motorcycle-accessories-online/bike-covers",
  "/motorcycle-accessories-online/chain-care",

  // Spares
  "/bike-spares/chain-sprocket-kits",
  "/bike-spares/iridium-spark-plug",
  "/bike-spares/performance-air-filter-bike",
  "/bike-spares/brake-pads",

  // Gadgets
  "/gadgets/bike-phone-holders",
  "/gadgets/communicators"
];

function cleanLinks(html: string): string {
  if (!html) return "";
  let res = html;
  // Replace absolute store4riders links with relative links and remove .html
  res = res.replace(/href=["']https?:\/\/(?:www\.)?store4riders\.com\/?([^"']*)["']/gi, (_match, p) => {
    const cleanPath = p ? `/${p.replace(/\.html(\?.*)?$/i, "$1")}` : "/";
    return `href="${cleanPath}"`;
  });
  // Replace relative .html links
  res = res.replace(/href=["']\/([^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');
  // External links get target="_blank"
  res = res.replace(/<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/(?!(?:www\.)?store4riders\.com)[^"']+)["']([^>]*)>/gi, (_match, url, rest) => {
    const cleanRest = rest.replace(/\s*(?:target|rel)=["'][^"']*["']/gi, "");
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"${cleanRest}>`;
  });
  return res;
}

interface ScrapedData {
  title: string;
  metaDesc: string;
  descriptionHtml: string;
  faqs: Array<{ question: string; answer: string }>;
}

async function scrapeCategoryPage(urlPath: string): Promise<ScrapedData | null> {
  const fullUrl = `https://www.store4riders.com${urlPath}.html`;
  try {
    const res = await fetch(fullUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) {
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").text().trim() || $('meta[name="title"]').attr("content") || "";
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const descEl = $(".category-description");

    if (!descEl || descEl.length === 0) {
      return null;
    }

    const rawHtml = descEl.html() || "";
    if (rawHtml.trim().length === 0) {
      return null;
    }

    // 1. Try JSON-LD first
    let faqs: Array<{ question: string; answer: string }> = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || "{}");
        if (json["@type"] === "FAQPage" && Array.isArray(json.mainEntity)) {
          json.mainEntity.forEach((item: any) => {
            if (item["@type"] === "Question" && item.name && item.acceptedAnswer?.text) {
              faqs.push({
                question: item.name.trim(),
                answer: cleanLinks(item.acceptedAnswer.text.trim())
              });
            }
          });
        }
      } catch {}
    });

    // 2. Robust DOM-based separation of Description & FAQs
    const $root = cheerio.load(`<div id="s4r-root">${rawHtml}</div>`, null, false);
    const rootEl = $root("#s4r-root");

    let faqHeadingEl: any = null;
    rootEl.find("h1, h2, h3, h4, h5, h6, p").each((_, el) => {
      if (faqHeadingEl) return;
      const t = $root(el).text().trim();
      if (/^(?:FAQs?|Frequently Asked Questions)/i.test(t) || /Frequently Asked Questions\s*\([A-Za-z0-9\s-]+\)/i.test(t) || (/\bFAQs\b/i.test(t) && t.length < 60)) {
        faqHeadingEl = $root(el);
      }
    });

    let descHtml = rawHtml;

    if (faqHeadingEl) {
      const faqContainer = cheerio.load(`<div id="faq-collector"></div>`, null, false);
      const collector = faqContainer("#faq-collector");

      let cur = faqHeadingEl;
      const toRemove = [cur];
      let next = cur.next();
      while (next.length > 0) {
        toRemove.push(next);
        collector.append(next.clone());
        next = next.next();
      }

      toRemove.forEach(el => el.remove());
      descHtml = rootEl.html() || "";

      // Parse FAQs from collector
      const collectorFaqs: Array<{ question: string; answer: string }> = [];

      // Pattern 1: .s4r-faq-item blocks (e.g. bike covers)
      const faqItems = collector.find(".s4r-faq-item");
      if (faqItems.length > 0) {
        faqItems.each((_, item) => {
          const qEl = faqContainer(item).find("strong, b, h3, h4, .s4r-faq-q").first();
          const aEl = faqContainer(item).find("p, .s4r-faq-a").last();
          const qText = qEl.text().replace(/^Q\d*[:.]\s*/i, "").trim();
          const aHtml = aEl.html() || aEl.text().trim();
          if (qText && aHtml && !collectorFaqs.some(f => f.question === qText)) {
            collectorFaqs.push({ question: qText, answer: cleanLinks(aHtml.replace(/^A\d*[:.]\s*/i, "").trim()) });
          }
        });
      }

      // Pattern 2: Single <p> containing <strong>Q: ...</strong><br>A: ...
      // (This is the predominant Magento pattern across store4riders!)
      if (collectorFaqs.length === 0) {
        collector.find("p").each((_, p) => {
          const strongQ = faqContainer(p).find("strong, b").first();
          if (strongQ.length > 0 && /^(?:Q\d*|Question\d*)[:.]/i.test(strongQ.text().trim())) {
            const qRaw = strongQ.text().trim();
            const question = qRaw.replace(/^(?:Q\d*|Question\d*)[:.]\s*/i, "").trim();

            const pClone = faqContainer(p).clone();
            pClone.find("strong, b").first().remove();
            let aHtml = pClone.html() || "";
            aHtml = aHtml.replace(/^\s*(?:<br\s*\/?>|\n|\r)+\s*/i, "")
                         .replace(/^(?:<strong>|<b>)?\s*(?:A\d*|Answer\d*)[:.]\s*(?:<\/strong>|<\/b>)?\s*/i, "")
                         .replace(/^\s*(?:<br\s*\/?>|\n|\r)+\s*/i, "")
                         .trim();

            if (question && aHtml && !collectorFaqs.some(f => f.question === question)) {
              collectorFaqs.push({ question, answer: cleanLinks(aHtml) });
            }
          }
        });
      }

      // Pattern 3: Heading Question + Next Paragraph Answer (e.g. <h3>Q: ...</h3> <p>A: ...</p>)
      if (collectorFaqs.length === 0) {
        collector.find("h2, h3, h4, h5, h6, strong, b").each((_, el) => {
          if (faqContainer(el).children("div, p, ul, ol").length > 0) return;
          const text = faqContainer(el).text().trim();
          const qMatch = text.match(/^(?:Q\d*[:.]\s*|Question\s*\d*[:.]\s*)(.+)/i);
          if (qMatch) {
            const question = qMatch[1].trim();
            let parentOrEl = faqContainer(el).is("strong, b") ? faqContainer(el).parent() : faqContainer(el);
            const pText = parentOrEl.text().trim();
            if (!/\bA\d*[:.]/i.test(pText)) {
              let ansEl = parentOrEl.next();
              if (ansEl.length > 0) {
                let aHtml = ansEl.html() || ansEl.text();
                let answer = aHtml.replace(/^<strong>\s*A\d*[:.]\s*<\/strong>\s*/i, "")
                                  .replace(/^A\d*[:.]\s*/i, "")
                                  .trim();
                if (question && answer && !collectorFaqs.some(f => f.question === question)) {
                  collectorFaqs.push({ question, answer: cleanLinks(answer) });
                }
              }
            }
          }
        });
      }

      // Pattern 4: Plain text regex split fallback on full text
      if (collectorFaqs.length === 0) {
        const fullFaqText = collector.text();
        const regex = /(?:Q\d*|Question\d*)[:.]\s*(.+?)\s*(?:A\d*|Answer\d*)[:.]\s*([\s\S]+?)(?=(?:Q\d*|Question\d*)[:.]|$)/gi;
        let m;
        while ((m = regex.exec(fullFaqText)) !== null) {
          const q = m[1].replace(/[\r\n]+/g, " ").trim();
          const a = m[2].replace(/[\r\n]+/g, " ").trim();
          if (q && a && !collectorFaqs.some(f => f.question === q)) {
            collectorFaqs.push({ question: q, answer: cleanLinks(a) });
          }
        }
      }

      // Merge: prefer collector if it found more or equal, otherwise keep json-ld
      if (collectorFaqs.length >= faqs.length && collectorFaqs.length > 0) {
        faqs = collectorFaqs;
      }
    }

    return {
      title,
      metaDesc,
      descriptionHtml: cleanLinks(descHtml),
      faqs
    };
  } catch (err: any) {
    return null;
  }
}

const EXACT_SLUG_MAP: Record<string, string[]> = {
  "open-face-helmets": ["open-face-helmets", "open-face-helmet"],
  "off-road-helmets": ["off-road-helmets-motocross-helmet", "off-road-helmets", "off-road-helmet", "motocross-helmet"],
  "helmet-accessories": ["helmet-accessories", "helmet-visors-accessories"],
  "riding-jackets": ["riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets", "riding-jackets"],
  "riding-gloves": ["riding-gloves-biker-gloves", "riding-gloves"],
  "semi-gauntlet-gloves": ["semi-gauntlet-bike-riding-gloves", "semi-gauntlet-gloves"],
  "short-motorbike-gloves": ["short-cuff-biker-gloves", "short-motorbike-gloves"],
  "motorcycle-riding-jeans": ["riding-jeans", "motorcycle-riding-jeans"],
  "knee-guards-bikers": ["knee-guards-for-bikers", "knee-guards-bikers"],
  "short-biking-boots": ["short-city-riding-biking-boots", "short-biking-boots"],
  "off-road-riding-boots": ["off-road-riding-boots-motocross-boots", "off-road-riding-boots"],
  "sports-riding-shoes": ["sports-riding-shoes"],
  "riding-gear-for-women": ["women-riding-gear", "riding-gear-for-women"],
  "tank-bags-bikes": ["tank-bags-for-bike", "tank-bags", "tank-bags-bikes"],
  "saddle-bags-bikes": ["saddle-bags-for-bikes-panniers", "saddle-bags", "saddle-bags-bikes"],
  "bike-top-box": ["bike-top-box", "top-box"],
  "hydration-bag": ["hydration-bags", "hydration-bag"],
  "motorcycle-other-luggage": ["other-luggage", "motorcycle-other-luggage"],
  "bike-auxiliary-light-clamps-mounts": ["bike-auxiliary-light-clamps-and-mounts", "bike-auxiliary-light-clamps-mounts"],
  "auxiliary-light-wiring-harness-switch": ["auxiliary-light-wiring-harness-and-switch", "auxiliary-light-wiring-harness-switch"],
  "off-beat-motorcycle-accessories": ["off-beat-motorcycle-accessories"],
  "performance-air-filter-bike": ["performance-air-filters-for-bikes", "performance-air-filter-bike"],
  "brake-pads": ["brake-pads", "brake-pads-online"],
  "bike-phone-holders": ["bike-phone-holders-mobile-holder-for-bike", "bike-phone-holders"],
};

async function findTargetCategory(urlPath: string) {
  const segments = urlPath.replace(/^\//, "").split("/");
  const candidateSlug = segments[segments.length - 1];
  const fullPathSlug = segments.join("-");

  // Query variations to find matching category in MongoDB
  const queryOr: any[] = [
    { slug: candidateSlug },
    { slug: fullPathSlug },
    { slug: candidateSlug.replace(/s$/, "") },
    { slug: candidateSlug + "s" }
  ];

  if (EXACT_SLUG_MAP[candidateSlug]) {
    for (const s of EXACT_SLUG_MAP[candidateSlug]) {
      queryOr.push({ slug: s });
    }
  }

  const category = await CategoryModel.findOne({ $or: queryOr });
  return { category, candidateSlug, parentSlug: segments.length > 1 ? segments[0] : null };
}

async function runBatchSync() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI or DATABASE_URL not set");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  console.log(`\n🚀 Starting Batch Category Sync for ${CATEGORY_PATHS.length} storefront categories...\n`);

  let successCount = 0;
  let skipCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < CATEGORY_PATHS.length; i++) {
    const pathStr = CATEGORY_PATHS[i];
    process.stdout.write(`[${i + 1}/${CATEGORY_PATHS.length}] ${pathStr} ... `);

    // 1. Scrape data from live store4riders.com
    const scraped = await scrapeCategoryPage(pathStr);
    if (!scraped) {
      console.log("⚠️ No live category-description found (skipped).");
      skipCount++;
      continue;
    }

    // 2. Find Category in MongoDB
    const { category, candidateSlug, parentSlug } = await findTargetCategory(pathStr);

    let targetCat = category;

    if (!targetCat) {
      console.log(`➕ Creating new category in MongoDB for slug: ${candidateSlug}...`);
      let parentId: any = undefined;
      if (parentSlug) {
        const parentCat = await CategoryModel.findOne({
          $or: [{ slug: parentSlug }, { slug: parentSlug.replace(/s$/, "") }]
        });
        if (parentCat) parentId = parentCat._id;
      }

      const cleanName = scraped.title.split("|")[0].split("-")[0].trim() || candidateSlug;
      targetCat = new CategoryModel({
        name: cleanName,
        slug: candidateSlug,
        includeInMenu: true,
        parentId: parentId
      });
    }

    // 3. Update category document
    targetCat.description = scraped.descriptionHtml;
    targetCat.faqs = scraped.faqs as any;
    if (scraped.title) targetCat.metaTitle = scraped.title;
    if (scraped.metaDesc) targetCat.metaDescription = scraped.metaDesc;

    await targetCat.save();
    console.log(`✅ SAVED: "${targetCat.name}" (Slug: ${targetCat.slug}) | Desc: ${scraped.descriptionHtml.length} chars | FAQs: ${scraped.faqs.length}`);

    // If targetCat had an alias slug (different from candidateSlug), also ensure candidateSlug category exists
    if (targetCat.slug !== candidateSlug) {
      let candidateCat = await CategoryModel.findOne({ slug: candidateSlug });
      if (!candidateCat) {
        candidateCat = new CategoryModel({
          name: targetCat.name,
          slug: candidateSlug,
          includeInMenu: true,
          parentId: targetCat.parentId
        });
      }
      candidateCat.description = scraped.descriptionHtml;
      candidateCat.faqs = scraped.faqs as any;
      if (scraped.title) candidateCat.metaTitle = scraped.title;
      if (scraped.metaDesc) candidateCat.metaDescription = scraped.metaDesc;
      await candidateCat.save();
      console.log(`   🔗 Also updated candidate alias: "${candidateCat.name}" (Slug: ${candidateSlug})`);
    }

    successCount++;

    // Small courteous delay to avoid hammering server
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n==========================================");
  console.log(`🎉 Batch Sync Complete!`);
  console.log(`   ✅ Successfully updated: ${successCount}`);
  console.log(`   ⚠️ Skipped (no live desc): ${skipCount}`);
  console.log(`   ❌ Not found in DB: ${notFoundCount}`);
  console.log("==========================================");

  try {
    await CategoryService.invalidateCache();
    await fetch("http://localhost:4000/api/v1/categories/revalidate").catch(() => {});
    console.log("✅ Category Redis / in-memory cache flushed successfully on server.");
  } catch (err) {
    console.warn("⚠️ Cache flush warning:", err);
  }

  await mongoose.disconnect();
  console.log("MongoDB connection closed.");
}

runBatchSync().catch(err => {
  console.error("Fatal error during batch category sync:", err);
  process.exit(1);
});
