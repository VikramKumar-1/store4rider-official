const mongoose = require('mongoose');
const cheerio = require('cheerio');
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in backend/.env');
  process.exit(1);
}

// Brand mapping: DB slug -> live site URL & alias
const BRAND_URL_MAP = {
  'biking-brotherhood': {
    url: 'https://www.store4riders.com/brands/biking-brotherhood-riding-gear',
    name: 'Biking Brotherhood',
    aliases: ['biking-brotherhood-riding-gear', 'bbg']
  },
  'rynox-gear': {
    url: 'https://www.store4riders.com/brands/rynox-gears',
    name: 'Rynox Gear',
    aliases: ['rynox-gears', 'rynox']
  },
  'smk-helmets': {
    url: 'https://www.store4riders.com/brands/smk-helmets',
    name: 'SMK Helmets',
    aliases: ['smk', 'smk-helmet']
  },
  'raida-gears': {
    url: 'https://www.store4riders.com/brands/raida-gears',
    name: 'Raida Gears',
    aliases: ['raida', 'raida-gear']
  },
  'sas-tec': {
    url: 'https://www.store4riders.com/brands/sas-tec',
    name: 'SAS-TEC',
    aliases: ['sastec']
  },
  'forma-boots': {
    url: 'https://www.store4riders.com/brands/forma-adventure-boots-india',
    name: 'Forma Boots',
    aliases: ['forma-adventure-boots-india', 'forma']
  },
  'shoerella': {
    url: 'https://www.store4riders.com/brands/shoerella',
    name: 'Shoerella',
    aliases: []
  },
  'invictus': {
    url: 'https://www.store4riders.com/brands/invictus-gears',
    name: 'Invictus',
    aliases: ['invictus-gears']
  },
  'moto-torque': {
    url: 'https://www.store4riders.com/brands/moto-torque',
    name: 'Moto Torque',
    aliases: []
  },
  'barrel-exhaust': {
    url: 'https://www.store4riders.com/brands/barrel-exhaust',
    name: 'Barrel Exhaust',
    aliases: []
  },
  'carberry': {
    url: 'https://www.store4riders.com/brands/carberry',
    name: 'Carberry',
    aliases: []
  },
  'parani': {
    url: 'https://www.store4riders.com/brands/parani',
    name: 'Parani',
    aliases: []
  },
  'axor-helmets': {
    url: 'https://www.store4riders.com/brands/axor-helmets',
    name: 'Axor Helmets',
    aliases: ['axor', 'axor-helmet']
  },
  'mototech-gear': {
    url: 'https://www.store4riders.com/brands/mototech-riding-gear',
    name: 'MotoTech Gear',
    aliases: ['mototech-riding-gear', 'mototech']
  },
  'quipco': {
    url: 'https://www.store4riders.com/brands/quipco',
    name: 'Quipco',
    aliases: []
  },
  'safe-tech-protectors': {
    url: 'https://www.store4riders.com/brands/safe-tech-protectors',
    name: 'Safe-Tech Protectors',
    aliases: ['safe-tech']
  },
  'rolon': {
    url: 'https://www.store4riders.com/brands/rolon-chain-sprocket-kits',
    name: 'Rolon',
    aliases: ['rolon-chain-sprocket-kits']
  },
  'scala-gears': {
    url: 'https://www.store4riders.com/brands/scala-gears',
    name: 'Scala Gears',
    aliases: ['scala', 'scala-gear']
  },
  'furygan': {
    url: 'https://www.store4riders.com/brands/furygan-riding-gear-india',
    name: 'Furygan',
    aliases: ['furygan-riding-gear-india']
  },
  'falco': {
    url: 'https://www.store4riders.com/brands/falco-boots',
    name: 'Falco',
    aliases: ['falco-boots']
  },
  'ngk-spark-plugs': {
    url: 'https://www.store4riders.com/brands/ngk-spark-plugs',
    name: 'NGK Spark Plugs',
    aliases: ['ngk']
  },
  'motul': {
    url: null,
    name: 'Motul',
    aliases: ['motul-oil', 'motul-engine-oil']
  },
  'lone-ranger': {
    url: 'https://www.store4riders.com/brands/lone-ranger-india',
    name: 'Lone Ranger',
    aliases: ['lone-ranger-india']
  },
  'maddog': {
    url: 'https://www.store4riders.com/brands/maddog-lights',
    name: 'MadDog',
    aliases: ['maddog-lights', 'mad-dog']
  },
  'race-dynamics': {
    url: 'https://www.store4riders.com/brands/race-dynamics',
    name: 'Race Dynamics',
    aliases: []
  },
  'pro-spec-performance-parts': {
    url: 'https://www.store4riders.com/brands/pro-spec-performance-parts',
    name: 'Pro-Spec Performance Parts',
    aliases: ['pro-spec']
  },
  'bmc-air-filter': {
    url: 'https://www.store4riders.com/brands/bmc-air-filter-for-bike',
    name: 'BMC Air Filter',
    aliases: ['bmc-air-filter-for-bike', 'bmc']
  },
  'k-n-bike-air-filter': {
    url: 'https://www.store4riders.com/brands/k&n-bike-air-filter',
    name: 'K&N Bike Air Filter',
    aliases: ['k&n-bike-air-filter', 'kn-bike-air-filter', 'k-and-n']
  },
  'fly-racing': {
    url: 'https://www.store4riders.com/brands/fly-racing',
    name: 'Fly Racing',
    aliases: []
  },
  'moto-fusion': {
    url: null,
    name: 'Moto Fusion',
    aliases: ['moto-fusion-77']
  },
  'motospunk': {
    url: null,
    name: 'Motospunk',
    aliases: []
  }
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (!loc.startsWith('http')) loc = 'https://www.store4riders.com' + loc;
        return fetchPage(loc).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return resolve({ statusCode: res.statusCode, html: '' });
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: 200, html: data }));
    }).on('error', reject);
  });
}

function cleanLinks(html) {
  if (!html) return '';
  let res = html;
  res = res.replace(/href=["']https?:\/\/(?:www\.)?store4riders\.com\/?([^"']*)["']/gi, (match, p) => {
    const cleanPath = p ? `/${p.replace(/\.html(\?.*)?$/i, '$1')}` : '/';
    return `href="${cleanPath}"`;
  });
  res = res.replace(/href=["']\/([^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');
  res = res.replace(/<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/(?!(?:www\.)?store4riders\.com)[^"']+)["']([^>]*)>/gi, (match, url, rest) => {
    const cleanRest = rest.replace(/\s*(?:target|rel)=["'][^"']*["']/gi, '');
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"${cleanRest}>`;
  });
  return res;
}

function stripFaqsFromHtml(rawHtml) {
  if (!rawHtml) return '';
  const $ = cheerio.load(`<div id="root">${rawHtml}</div>`);
  
  // Find heading or element indicating FAQ start
  let faqStartEl = null;

  $('#root *').each((_, el) => {
    if (faqStartEl) return;
    const text = $(el).text().trim();
    const tag = el.tagName?.toLowerCase();
    
    // Check if this element is a heading or bold/strong block that starts FAQs
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'b'].includes(tag)) {
      if (/^(?:frequently\s*asked\s*questions|faqs?)\b/i.test(text)) {
        // Find top-level element under #root
        let topEl = $(el);
        while (topEl.parent().length && topEl.parent().attr('id') !== 'root') {
          topEl = topEl.parent();
        }
        faqStartEl = topEl;
      }
    }
  });

  if (faqStartEl && faqStartEl.length) {
    // Remove all next siblings
    faqStartEl.nextAll().remove();
    // Remove the FAQ heading itself
    faqStartEl.remove();
  }

  // Also strip any remaining Q1:, Q:, Question: that linger at the bottom
  let foundQuestion = true;
  while (foundQuestion) {
    foundQuestion = false;
    const lastChild = $('#root').children().last();
    if (lastChild.length) {
      const txt = lastChild.text().trim();
      if (/^(?:q\d*|question\d*|a\d*|answer\d*)\s*[:.]/i.test(txt) || /^(?:frequently\s*asked|faqs?)/i.test(txt)) {
        lastChild.remove();
        foundQuestion = true;
      }
    }
  }

  return $('#root').html()?.trim() || '';
}

function parseBrandPage(html) {
  const $ = cheerio.load(html);

  const metaTitle = $('title').text().trim() || $('meta[name="title"]').attr('content') || '';
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

  // Extract description container
  const $brandDesc = $('.brand-desc, .category-description');
  let fullDescHtml = $brandDesc.html() || '';

  // 1. Extract FAQs from JSON-LD structured data first
  let faqs = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      if (json['@type'] === 'FAQPage' && Array.isArray(json.mainEntity)) {
        json.mainEntity.forEach(item => {
          if (item['@type'] === 'Question' && item.name && item.acceptedAnswer?.text) {
            faqs.push({
              question: item.name.trim(),
              answer: item.acceptedAnswer.text.trim()
            });
          }
        });
      }
    } catch (e) {}
  });

  // 2. Regex fallback for Q1: ... A1: ... or Q1. ... A1. ... from text
  if (faqs.length === 0 && $brandDesc.length > 0) {
    const text = $brandDesc.text();
    const faqRegex = /(?:Q\d*|Question\s*\d*)\s*[:.]\s*(.+?)\s*(?:A\d*|Answer\s*\d*)\s*[:.]\s*([\s\S]+?)(?=(?:Q\d*|Question\s*\d*)\s*[:.]|\s*For make|$)/gi;
    let match;
    while ((match = faqRegex.exec(text)) !== null) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim()
      });
    }
  }

  // 3. Clean description: STRIP FAQs COMPLETELY from description HTML
  let cleanDescHtml = stripFaqsFromHtml(fullDescHtml);
  cleanDescHtml = cleanLinks(cleanDescHtml);

  // 4. Brand logo from live page
  const pageLogo = $('.brand-image img, .cdz-brand-logo img, .page-title-wrapper img').attr('src') || '';

  return {
    metaTitle,
    metaDescription,
    metaKeywords,
    description: cleanDescHtml,
    faqs,
    pageLogo
  };
}

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;


  const existingBrands = await db.collection('brands').find({}).toArray();
  console.log(`Found ${existingBrands.length} brands in MongoDB to update.`);

  for (const b of existingBrands) {
    const config = BRAND_URL_MAP[b.slug];
    const brandName = config?.name || b.name;
    const aliases = config?.aliases || [];

    console.log(`\n--------------------------------------------------`);
    console.log(`Processing [${b.slug}] "${brandName}"...`);

    let updateData = {
      name: brandName,
      aliases: aliases,
      updatedAt: new Date()
    };

    if (config?.url) {
      try {
        console.log(`Fetching ${config.url} ...`);
        const { statusCode, html } = await fetchPage(config.url);
        if (statusCode === 200 && html) {
          const parsed = parseBrandPage(html);
          console.log(`  Scraped Meta Title: ${parsed.metaTitle}`);
          console.log(`  Description Length (clean, no FAQs): ${parsed.description.length} chars`);
          console.log(`  FAQs Count: ${parsed.faqs.length}`);

          updateData.description = parsed.description || '';
          updateData.faqs = parsed.faqs && parsed.faqs.length > 0 ? parsed.faqs : (b.faqs || []);
          if (parsed.metaTitle) updateData.metaTitle = parsed.metaTitle;
          if (parsed.metaDescription) updateData.metaDescription = parsed.metaDescription;
          if (parsed.metaKeywords) updateData.metaKeywords = parsed.metaKeywords;
          if (!b.logo && parsed.pageLogo) updateData.logo = parsed.pageLogo;
        } else {
          console.log(`  Page returned status ${statusCode}. Keeping existing data.`);
          // If existing description has FAQs, clean it!
          if (b.description) {
            updateData.description = stripFaqsFromHtml(b.description);
          }
        }
      } catch (err) {
        console.error(`  Error scraping ${config.url}:`, err.message);
        if (b.description) {
          updateData.description = stripFaqsFromHtml(b.description);
        }
      }
    } else {
      console.log(`  No live URL configured. Keeping existing data.`);
      if (b.description) {
        updateData.description = stripFaqsFromHtml(b.description);
      } else {
        updateData.description = `<p>Explore official ${brandName} products at Store4Riders. Genuine motorcycle gear with manufacturer warranty and fast delivery across India.</p>`;
      }
    }

    // Special fix for Falco logo if missing
    if (b.slug === 'falco' && !b.logo) {
      updateData.logo = 'https://www.store4riders.com/media/codazon_cache/brand/120x120/Background.png';
    }

    const res = await db.collection('brands').updateOne(
      { _id: b._id },
      { $set: updateData }
    );
    console.log(`  Updated MongoDB: modifiedCount = ${res.modifiedCount}`);
  }

  console.log('\n==================================================');
  console.log('All DB brands have been re-processed and cleanly separated!');

  // Final check: verify NO brand has FAQs in its description
  console.log('\n--- VERIFYING NO FAQS REMAIN IN DESCRIPTIONS ---');
  const allUpdated = await db.collection('brands').find({}).toArray();
  let anyFaqInDesc = false;
  for (const b of allUpdated) {
    const hasFaq = /frequently\s*asked|faqs?|q\d+\s*[:.]/i.test(b.description || '');
    if (hasFaq) {
      console.error(`FAILED: Brand ${b.name} (${b.slug}) STILL HAS FAQ IN DESCRIPTION!`);
      anyFaqInDesc = true;
    }
  }

  if (!anyFaqInDesc) {
    console.log('SUCCESS: ZERO brands have FAQs in their description!');
  }

  console.log('\n--- BRANDS WITH STRUCTURED FAQS ---');
  allUpdated.filter(b => b.faqs?.length > 0).forEach(b => {
    console.log(` - ${b.name} (${b.slug}): ${b.faqs.length} FAQs`);
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
