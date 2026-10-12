const mongoose = require('mongoose');
const cheerio = require('cheerio');
const https = require('https');

const MONGODB_URI = 'mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders';
const TARGET_URL = 'https://www.store4riders.com/motorcycle-helmets/full-face-helmets.html';

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching', TARGET_URL, '...');
  const html = await fetchPage(TARGET_URL);
  const $ = cheerio.load(html);

  // 1. Meta information
  const metaTitle = $('title').text().trim() || $('meta[name="title"]').attr('content') || '';
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

  // 2. Extract Category Description HTML
  const $catDesc = $('.category-description');
  let fullDescHtml = $catDesc.html() || '';

  let cleanDescHtml = fullDescHtml;
  const faqSplit = fullDescHtml.split(/<h[23][^>]*>\s*FAQs\s*<\/h[23]>/i);
  if (faqSplit.length > 1) {
    cleanDescHtml = faqSplit[0].trim();
  }

  function cleanLinks(html) {
    if (!html) return '';
    let res = html;
    res = res.replace(/href=["']https?:\/\/(?:www\.)?store4riders\.com\/?([^"']*)["']/gi, (match, path) => {
      const cleanPath = path ? `/${path.replace(/\.html(\?.*)?$/i, '$1')}` : '/';
      return `href="${cleanPath}"`;
    });
    res = res.replace(/href=["']\/([^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');
    res = res.replace(/<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/(?!(?:www\.)?store4riders\.com)[^"']+)["']([^>]*)>/gi, (match, url, rest) => {
      const cleanRest = rest.replace(/\s*(?:target|rel)=["'][^"']*["']/gi, '');
      return `<a href="${url}" target="_blank" rel="noopener noreferrer"${cleanRest}>`;
    });
    return res;
  }

  cleanDescHtml = cleanLinks(cleanDescHtml);

  // 3. Extract FAQs from structured data or HTML
  let faqs = [];
  
  // Try extracting from JSON-LD first (cleanest structure)
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

  // Fallback to regex if JSON-LD didn't have FAQs
  if (faqs.length === 0) {
    const text = $catDesc.text();
    const faqRegex = /Q\d+:\s*(.+?)\s*A\d+:\s*([\s\S]+?)(?=\s*Q\d+:|\s*For make|$)/g;
    let match;
    while ((match = faqRegex.exec(text)) !== null) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim()
      });
    }
  }

  console.log('Scraped Meta Title:', metaTitle);
  console.log('Scraped Meta Description:', metaDescription);
  console.log('Scraped FAQs Count:', faqs.length);
  console.log('Description Length (chars):', cleanDescHtml.length);

  // 4. Update MongoDB
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const updatePayload = {
    description: cleanDescHtml,
    faqs: faqs,
    metaTitle: metaTitle,
    metaDescription: metaDescription,
    metaKeywords: metaKeywords,
    updatedAt: new Date()
  };

  // Update existing category 'full-face-helmet' and ensure 'full-face-helmets' also exists
  const res1 = await db.collection('categories').updateOne(
    { slug: 'full-face-helmet' },
    { $set: updatePayload }
  );
  console.log('Updated full-face-helmet:', res1.modifiedCount);

  const res2 = await db.collection('categories').updateOne(
    { slug: 'full-face-helmets' },
    { 
      $set: {
        ...updatePayload,
        name: 'Full Face Helmets',
        slug: 'full-face-helmets'
      },
      $setOnInsert: {
        parentId: '6ac0f83bed338a8e53f2bef5', // motorcycle-helmets parent
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
  console.log('Upserted full-face-helmets:', res2.upsertedCount || res2.modifiedCount);

  // Print saved FAQs
  console.log('\n--- Saved FAQs Sample ---');
  faqs.forEach((f, i) => console.log(`Q${i+1}: ${f.question}\nA${i+1}: ${f.answer}\n`));

  mongoose.disconnect();
  console.log('Done!');
}

run().catch(err => {
  console.error('Scraping error:', err);
  process.exit(1);
});
