import * as cheerio from "cheerio";

function cleanLinks(html: string): string {
  if (!html) return "";
  let res = html;
  res = res.replace(/href=["']https?:\/\/(?:www\.)?store4riders\.com\/?([^"']*)["']/gi, (_match, p) => {
    const cleanPath = p ? `/${p.replace(/\.html(\?.*)?$/i, "$1")}` : "/";
    return `href="${cleanPath}"`;
  });
  res = res.replace(/href=["']\/([^"']+)\.html(\?[^"']*)?(#[^"']*)?["']/gi, 'href="/$1$2$3"');
  res = res.replace(/<a\s+(?:[^>]*?\s+)?href=["'](https?:\/\/(?!(?:www\.)?store4riders\.com)[^"']+)["']([^>]*)>/gi, (_match, url, rest) => {
    const cleanRest = rest.replace(/\s*(?:target|rel)=["'][^"']*["']/gi, "");
    return `<a href="${url}" target="_blank" rel="noopener noreferrer"${cleanRest}>`;
  });
  return res;
}

export function parseDescriptionAndFaqs(rawHtml: string, jsonLdFaqs: Array<{ question: string; answer: string }> = []) {
  if (!rawHtml || !rawHtml.trim()) {
    return { descHtml: "", faqs: jsonLdFaqs };
  }

  const $ = cheerio.load(`<div id="s4r-root">${rawHtml}</div>`, null, false);
  const root = $("#s4r-root");

  let faqs: Array<{ question: string; answer: string }> = [...jsonLdFaqs];

  // 1. Locate the FAQ heading element
  let faqHeadingEl: any = null;
  root.find("h1, h2, h3, h4, h5, h6, p").each((_, el) => {
    if (faqHeadingEl) return;
    const t = $(el).text().trim();
    if (/^(?:FAQs?|Frequently Asked Questions)/i.test(t) || /Frequently Asked Questions\s*\([A-Za-z0-9\s-]+\)/i.test(t) || /\bFAQs\b/i.test(t) && t.length < 60) {
      faqHeadingEl = $(el);
    }
  });

  let descHtml = rawHtml;

  if (faqHeadingEl) {
    // Collect all elements from faqHeadingEl to the end of its parent
    const faqContainer = cheerio.load(`<div id="faq-collector"></div>`, null, false);
    const collector = faqContainer("#faq-collector");

    // Gather siblings following faqHeadingEl
    let cur = faqHeadingEl;
    const toRemove = [cur];
    let next = cur.next();
    while (next.length > 0) {
      toRemove.push(next);
      collector.append(next.clone());
      next = next.next();
    }

    // Remove them from root so root only contains pure description!
    toRemove.forEach(el => el.remove());
    descHtml = root.html() || "";

    if (faqs.length === 0) {
      // Check for .s4r-faq-item blocks first
      const faqItems = collector.find(".s4r-faq-item");
      if (faqItems.length > 0) {
        faqItems.each((_, item) => {
          const qEl = $(item).find("strong, b, h3, h4").first();
          const aEl = $(item).find("p").first();
          const qText = qEl.text().replace(/^Q\d*[:.]\s*/i, "").trim();
          const aHtml = aEl.html() || aEl.text().trim();
          if (qText && aHtml && !faqs.some(f => f.question === qText)) {
            faqs.push({ question: qText, answer: cleanLinks(aHtml) });
          }
        });
      }

      // Check standard tags if still empty
      if (faqs.length === 0) {
        collector.find("h2, h3, h4, h5, h6, strong, b").each((_, el) => {
          // Skip if this element contains block children
          if ($(el).children("div, p, ul, ol").length > 0) return;
          const text = $(el).text().trim();
          const qMatch = text.match(/^(?:Q\d*[:.]\s*|Question\s*\d*[:.]\s*)(.+)/i);
          if (qMatch) {
            const question = qMatch[1].trim();
            let answer = "";

            let parentOrEl = $(el).is("strong, b") ? $(el).parent() : $(el);
            let ansEl = parentOrEl.next();
            if (ansEl.length > 0) {
              let aHtml = ansEl.html() || ansEl.text();
              answer = aHtml.replace(/^<strong>\s*A\d*[:.]\s*<\/strong>\s*/i, "")
                            .replace(/^A\d*[:.]\s*/i, "")
                            .trim();
            }

            if (question && answer && !faqs.some(f => f.question === question)) {
              faqs.push({
                question,
                answer: cleanLinks(answer)
              });
            }
          }
        });
      }

      // Fallback: If still empty, try regex over collector's text
      if (faqs.length === 0) {
        const fullFaqText = collector.text();
        const regex = /(?:Q\d*|Question\d*)[:.]\s*(.+?)\s*(?:A\d*|Answer\d*)[:.]\s*([\s\S]+?)(?=(?:Q\d*|Question\d*)[:.]|$)/gi;
        let m;
        while ((m = regex.exec(fullFaqText)) !== null) {
          const q = m[1].trim();
          const a = m[2].trim();
          if (q && a && !faqs.some(f => f.question === q)) {
            faqs.push({ question: q, answer: a });
          }
        }
      }
    }
  }

  return {
    descHtml: cleanLinks(descHtml.trim()),
    faqs
  };
}

async function runTest() {
  const testUrls = [
    "https://www.store4riders.com/bike-spares/chain-sprocket-kits.html",
    "https://www.store4riders.com/motorcycle-bags-bike-luggage/tank-bags-bikes.html",
    "https://www.store4riders.com/gadgets/communicators.html",
    "https://www.store4riders.com/riding-gear/riding-pants.html",
    "https://www.store4riders.com/riding-gear/motorcycle-riding-boots.html",
    "https://www.store4riders.com/motorcycle-accessories-online/bike-covers.html",
    "https://www.store4riders.com/motorcycle-helmets/off-road-helmets.html"
  ];

  for (const url of testUrls) {
    console.log("\n------------------------------------------------");
    console.log("Testing:", url);
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract JSON-LD FAQs if any
    let jsonLdFaqs: any[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const j = JSON.parse($(el).html() || "{}");
        if (j["@type"] === "FAQPage" && Array.isArray(j.mainEntity)) {
          j.mainEntity.forEach((item: any) => {
            if (item["@type"] === "Question" && item.name && item.acceptedAnswer?.text) {
              jsonLdFaqs.push({
                question: item.name.trim(),
                answer: item.acceptedAnswer.text.trim()
              });
            }
          });
        }
      } catch {}
    });

    const rawHtml = $(".category-description").html() || "";
    const result = parseDescriptionAndFaqs(rawHtml, jsonLdFaqs);

    console.log("Clean Desc length:", result.descHtml.length);
    console.log("Contains FAQ in clean desc:", /FAQ|Frequently Asked/i.test(result.descHtml));
    console.log("Separated FAQs count:", result.faqs.length);
    if (/off-road-helmets|bike-covers/i.test(url)) {
      console.log("FAQ sample 1:", result.faqs[0]);
      console.log("FAQ sample 2:", result.faqs[1]);
      const idx = result.descHtml.search(/FAQ|Frequently Asked/i);
      if (idx !== -1) {
        console.log("Remaining FAQ marker in descHtml:", result.descHtml.slice(idx - 30, idx + 100));
      }
    }
  }
}

runTest();
