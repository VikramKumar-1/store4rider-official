import * as cheerio from "cheerio";

async function testScrape() {
  const url = "https://www.store4riders.com/motorcycle-helmets/open-face-helmets.html";
  console.log("Fetching:", url);
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("title").text().trim();
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const descEl = $(".category-description");
  console.log("Title:", title);
  console.log("MetaDesc:", metaDesc);
  console.log("Has .category-description:", descEl.length > 0);
  console.log("Desc HTML length:", descEl.html()?.length || 0);

  // Check JSON-LD
  let faqs: Array<{ question: string; answer: string }> = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      if (data["@type"] === "FAQPage" && Array.isArray(data.mainEntity)) {
        faqs = data.mainEntity.map((q: any) => ({
          question: q.name,
          answer: q.acceptedAnswer?.text || ""
        }));
      }
    } catch {}
  });

  const rawHtml = descEl.html() || "";
  // 1. Separate description and FAQ section
  let descHtml = rawHtml;
  let faqHtml = "";
  const splitMatch = rawHtml.match(/<h[234][^>]*>\s*(?:Frequently Asked Questions|FAQs?)\s*<\/h[234]>/i) ||
                     rawHtml.match(/<p[^>]*>\s*<strong>\s*(?:Frequently Asked Questions|FAQs?)\s*<\/strong>\s*<\/p>/i);
  if (splitMatch && splitMatch.index !== undefined) {
    descHtml = rawHtml.slice(0, splitMatch.index).trim();
    faqHtml = rawHtml.slice(splitMatch.index + splitMatch[0].length).trim();
  }

  // 2. Extract FAQs
  if (faqs.length === 0 && faqHtml) {
    const $faq = cheerio.load(`<div>${faqHtml}</div>`);
    // Match <p><strong>Q...: Question?</strong></p><p><strong>A...:</strong> Answer</p>
    const pEls = $faq("p").toArray();
    for (let i = 0; i < pEls.length; i++) {
      const pText = $faq(pEls[i]).text().trim();
      const qMatch = pText.match(/^(?:Q\d*[:.]\s*|Question\s*\d*[:.]\s*)(.+)/i);
      if (qMatch) {
        const question = qMatch[1].trim();
        let answer = "";
        if (i + 1 < pEls.length) {
          const nextHtml = $faq(pEls[i + 1]).html() || "";
          answer = nextHtml.replace(/^<strong>\s*A\d*[:.]\s*<\/strong>\s*/i, "").trim();
          i++; // skip next since it's answer
        }
        faqs.push({ question, answer });
      }
    }
  }

  console.log("\n--- RESULT ---");
  console.log("Clean Desc Length:", descHtml.length);
  console.log("Clean Desc ends with:", descHtml.slice(-150));
  console.log("Parsed FAQs count:", faqs.length);
  console.log("Parsed FAQs:", JSON.stringify(faqs, null, 2));
}

testScrape();
