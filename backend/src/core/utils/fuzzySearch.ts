/**
 * @file fuzzySearch.ts
 * @description Fast, high-accuracy Levenshtein typo tolerance and fuzzy query resolution
 * for motorcycle riding gear, accessories, and brands.
 * Enables typo-tolerant search (e.g., 'helmt' -> 'helmet', 'jaket' -> 'jacket')
 * directly in Node.js and MongoDB Atlas without requiring Meilisearch.
 */

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export const MOTORCYCLE_VOCABULARY = [
  // Core Categories & Gear
  "helmet", "helmets", "jacket", "jackets", "glove", "gloves", 
  "boot", "boots", "shoe", "shoes", "visor", "visors", "pinlock",
  "luggage", "tankbag", "saddlebag", "tailbag", "backpack", "pouch",
  "pant", "pants", "trouser", "trousers", "suit", "onepiece",
  "armour", "armor", "protector", "guard", "chest", "back", "knee", "elbow",
  "balaclava", "mask", "buff", "neckwarmer",
  "rainwear", "raincoat", "waterproof", "raincover", "sock", "socks",
  "intercom", "bluetooth", "communicator", "headset",
  "mount", "holder", "mobile", "charger",
  "cleaner", "spray", "chain", "clean", "lube", "lubricant", "brush",
  "thermal", "baselayer", "windcheater", "innerwear",
  "airbag", "vest",

  // Major Motorcycle Gear Brands in Store4Riders
  "rynox", "axor", "smk", "raida", "viaterra", "alpinestars",
  "ls2", "forma", "falco", "tcx", "sidi", "dainese",
  "korda", "scoyco", "bbg", "sol", "vega", "studds", "steelbird",
  "mothe", "motul", "putoline", "wd40", "carbonado",
  "shoerella", "rynoxgears", "senabluetooth", "cardo"
];

/**
 * Corrects a single token against the vocabulary if it has a typo.
 * - Words of length 3-4: allows 1 typo
 * - Words of length >= 5: allows up to 2 typos
 */
export function correctTypo(token: string): string {
  const clean = token.toLowerCase().trim();
  if (clean.length < 3) return clean;

  // Exact match
  if (MOTORCYCLE_VOCABULARY.includes(clean)) return clean;

  let bestMatch = clean;
  let minDistance = Infinity;
  const maxAllowed = clean.length <= 4 ? 1 : 2;

  for (const word of MOTORCYCLE_VOCABULARY) {
    const dist = levenshteinDistance(clean, word);
    if (dist < minDistance && dist <= maxAllowed) {
      minDistance = dist;
      bestMatch = word;
      if (dist === 1) break;
    }
  }

  return bestMatch;
}

/**
 * Resolves search terms with typo tolerance.
 */
export function resolveFuzzySearchTerms(rawQuery: string): {
  terms: string[];
  correctedTerms: string[];
  isCorrected: boolean;
  correctedQuery: string;
} {
  const rawTerms = rawQuery
    .trim()
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  let isCorrected = false;
  const correctedTerms = rawTerms.map((term) => {
    const corrected = correctTypo(term);
    if (corrected !== term.toLowerCase()) {
      isCorrected = true;
    }
    return corrected;
  });

  return {
    terms: rawTerms,
    correctedTerms,
    isCorrected,
    correctedQuery: correctedTerms.join(" "),
  };
}
