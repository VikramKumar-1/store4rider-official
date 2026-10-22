import * as cheerio from "cheerio";

const testUrls = [
  "https://www.store4riders.com/riding-gear/riding-jackets.html",
  "https://www.store4riders.com/motorcycle-bags-bike-luggage/tank-bags-bikes.html",
  "https://www.store4riders.com/bike-spares/chain-sprocket-kits.html",
  "https://www.store4riders.com/gadgets/communicators.html",
  "https://www.store4riders.com/riding-gear/riding-pants.html",
  "https://www.store4riders.com/motorcycle-helmets/off-road-helmets.html",
  "https://www.store4riders.com/riding-gear/motorcycle-riding-boots.html",
  "https://www.store4riders.com/motorcycle-accessories-online/bike-covers.html"
];

async function inspect() {
  for (const url of testUrls) {
    console.log("\n=======================================================");
    console.log("Inspecting:", url);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Check JSON-LD
    let jsonLdFaqs: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const j = JSON.parse($(el).html() || "{}");
        if (j["@type"] === "FAQPage" && Array.isArray(j.mainEntity)) {
          jsonLdFaqs = j.mainEntity;
        }
      } catch {}
    });
    console.log("JSON-LD FAQ count:", jsonLdFaqs.length);

    // 2. Check category-description
    const descEl = $(".category-description");
    const rawHtml = descEl.html() || "";
    const text = descEl.text();

    console.log("Desc HTML length:", rawHtml.length);

    // Check headings inside descEl
    const headings: string[] = [];
    descEl.find("h1, h2, h3, h4, h5, h6, strong, b").each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 0 && t.length < 80) {
        headings.push($(el).prop("tagName") + ": " + t);
      }
    });
    console.log("Headings/strong tags found (sample 10):", headings.slice(0, 10));

    // Check for "FAQ", "Q:", "Q1:", "Frequently"
    const faqMatches = rawHtml.match(/(?:faq|frequently asked|questions\?|Q\d+[:.]|Q:)/gi) || [];
    console.log("FAQ keyword matches:", faqMatches.slice(0, 5));

    // If there's a match, show snippet
    const idx = rawHtml.search(/FAQ|Frequently Asked|Q1[:.]|Q[:.]/i);
    if (idx !== -1) {
      console.log("Snippet around first match:");
      console.log(rawHtml.slice(Math.max(0, idx - 50), idx + 400));
    }
  }
}

inspect();
