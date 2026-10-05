import fs from 'fs';
import * as cheerio from 'cheerio';
import https from 'https';

async function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function scrapeCategory() {
  const url = 'https://www.store4riders.com/motorcycle-helmets.html';
  console.log('Fetching', url, '...');
  
  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    // In Magento 2, category descriptions are usually in a div with class .category-description
    let descriptionHtml = $('.category-description').html() || '';
    let descriptionText = $('.category-description').text() || '';

    if (!descriptionText) {
      console.log('Could not find .category-description. Dumping some page text instead:');
      console.log($('body').text().substring(0, 500));
      return;
    }

    // Now let's run our FAQ extractor on the text
    const faqRegex = /Q\d+:\s*(.+?)\s*A\d+:\s*([\s\S]+?)(?=\s*Q\d+:|$)/g;
    const faqs: any[] = [];
    let match;
    
    while ((match = faqRegex.exec(descriptionText)) !== null) {
      faqs.push({
        question: match[1].trim(),
        answer: match[2].trim()
      });
    }

    // Clean description by finding where "FAQs" starts
    let cleanDescription = descriptionText;
    const firstQIndex = descriptionText.search(/Q1:/);
    if (firstQIndex !== -1) {
      cleanDescription = descriptionText.substring(0, firstQIndex).replace(/FAQs\s*$/i, '').trim();
    }

    console.log("=== SCRAPED CLEAN DESCRIPTION ===");
    console.log(cleanDescription.substring(0, 300) + '...');
    
    console.log("\n=== SCRAPED FAQS ===");
    console.log(JSON.stringify(faqs, null, 2));

  } catch (error) {
    console.error('Error scraping:', error);
  }
}

scrapeCategory();
