
export const slugMap: Record<string, string> = {
  "full-face-helmets": "full-face",
  "modular-helmets": "modular-flip-up",
  "half-face-helmets": "open-face",
  "off-road-motocross": "off-road-motocross-gear",
  "off-road-riding-boots": "off-road-riding-boots",
  "riding-jacket": "riding-jackets",
  "riding-jean": "riding-jeans",
  "touring-pant": "touring-pants",
  "knee-guard": "knee-guards",
  "saddle-bags": "saddle-bags-bikes",
  "tail-bags": "motorcycle-tail-bags",
  "women-riding-gear": "riding-gear-for-women"
};

export function getCategoryRegexRule(categorySlug: string): any {
  let cleanSlug = categorySlug.toLowerCase().trim();
  if (slugMap[cleanSlug]) {
    cleanSlug = slugMap[cleanSlug];
  }

  let regexRule: any = null;

  if (cleanSlug.includes("visor") || cleanSlug.includes("pinlock")) {
    regexRule = {
      $or: [
        { magentoCategories: /visor|pinlock/i },
        { name: /visor|pinlock/i },
      ]
    };
  } else if (cleanSlug.includes("balaclava")) {
    regexRule = {
      $or: [
        { magentoCategories: /balaclava|face mask/i },
        { name: /balaclava|face mask|head mask/i },
      ]
    };
  } else if (cleanSlug.includes("intercom") || cleanSlug.includes("bluetooth")) {
    regexRule = {
      $or: [
        { magentoCategories: /intercom|bluetooth|communication/i },
        { name: /intercom|bluetooth|sena|cardo|parani/i },
      ]
    };
  } else if (cleanSlug.includes("cleaner") || cleanSlug.includes("spray") || cleanSlug.includes("care")) {
    regexRule = {
      $or: [
        { magentoCategories: /cleaner|spray|care|maintenance/i },
        { name: /cleaner|cleaning|spray|wash|polish|lube/i },
      ]
    };
  } else if (cleanSlug.includes("helmet-visor")) {
    regexRule = {
      $or: [{ name: /visor/i }, { magentoCategories: /visor/i }]
    };
  } else if (cleanSlug.includes("mask") || cleanSlug.includes("bandana")) {
    regexRule = {
      $or: [{ name: /balaclava|mask|bandana/i }, { magentoCategories: /balaclava|mask|bandana/i }]
    };
  } else if (cleanSlug.includes("full-face-helmet") || cleanSlug.includes("full-face")) {
    regexRule = {
      $or: [
        { magentoCategories: /full.*face/i },
        { name: /full.*face/i },
      ],
      name: { $not: /\b(visor|visors|pinlock|spoiler|deflector|pad|pads|screw|lock|chin\s*curtain|ratchet|pivot|vent|vents|replacement)\b/i }
    };
  } else if (cleanSlug.includes("modular-helmet") || cleanSlug.includes("flip-up")) {
    regexRule = {
      $or: [{ name: /modular|flip.*up/i }, { magentoCategories: /modular|flip.*up/i }]
    };
  } else if (cleanSlug.includes("half-face-helmet") || cleanSlug.includes("open-face")) {
    regexRule = {
      $or: [{ name: /half.*face|open.*face/i }, { magentoCategories: /half.*face|open.*face/i }]
    };
  } else if (cleanSlug.includes("off-road-helmet") || cleanSlug.includes("motocross-helmet")) {
    regexRule = {
      $or: [{ name: /off.*road|motocross/i }, { magentoCategories: /off.*road|motocross/i }]
    };
  } else if (cleanSlug.includes("helmet")) {
    const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
    regexRule = {
      $or: [
        { name: new RegExp(keywords.split(" ").join(".*"), "i") },
        { magentoCategories: new RegExp(keywords, "i") }
      ],
      name: { $not: /\b(visor|visors|pinlock|nose\s*deflector|breath\s*deflector|cheek\s*pad|cheek\s*pads|spoiler|shield\s*mechanism|anti-fog|helmet\s*cleaner|helmet\s*spray|cleaning\s*spray|balaclava|mask|bandana|sleeve|sleeves|combo|chin\s*curtain|ratchet|pivot|screw|lock|vent|vents|replacement)\b/i }
    };
  } else if (cleanSlug.includes("jacket") || cleanSlug.includes("suit")) {
    const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
    regexRule = {
      $or: [
        { name: new RegExp(keywords.split(" ").join(".*"), "i") },
        { 
          magentoCategories: new RegExp(keywords, "i"),
          name: { $not: /\b(protector|armour|armor|insert|knee|hip|elbow|chest|back\s*armor|base\s*layer|t-shirt|jersey|lower|pants?)\b/i }
        }
      ],
      name: { $not: /\b(hip\s*protector|knee\s*protector|elbow\s*protector|back\s*protector|armour\s*insert|armor\s*insert|back\s*armor|base\s*layer)\b/i }
    };
  } else if (cleanSlug.includes("short-biking-boot")) {
    regexRule = {
      $or: [{ name: /short.*boot|short.*riding/i }, { magentoCategories: /short.*boot|city/i }]
    };
  } else if (cleanSlug.includes("sports-riding-shoe")) {
    regexRule = {
      $or: [{ name: /sport.*shoe|riding.*shoe/i }, { magentoCategories: /sport.*shoe|riding.*shoe/i }]
    };
  } else if (cleanSlug.includes("off-road-boot") || cleanSlug.includes("offroad-boot")) {
    regexRule = {
      $or: [{ name: /off.*road.*boot|motocross/i }, { magentoCategories: /off.*road.*boot/i }]
    };
  } else if (cleanSlug.includes("boot") || cleanSlug.includes("shoe")) {
    const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
    regexRule = {
      $or: [
        { name: new RegExp(keywords.split(" ").join(".*"), "i") },
        { magentoCategories: new RegExp(keywords, "i") }
      ],
      name: { $not: /\b(toe\s*slider|laces?|insole)\b/i }
    };
  } else if (cleanSlug.includes("full-gauntlet-glove")) {
    regexRule = {
      $or: [{ name: /full.*gauntlet/i }, { magentoCategories: /full.*gauntlet/i }]
    };
  } else if (cleanSlug.includes("semi-gauntlet-glove")) {
    regexRule = {
      $or: [{ name: /semi.*gauntlet/i }, { magentoCategories: /semi.*gauntlet/i }]
    };
  } else if (cleanSlug.includes("short-motorbike-glove") || cleanSlug.includes("short-glove")) {
    regexRule = {
      $or: [{ name: /short.*glove/i }, { magentoCategories: /short.*glove/i }]
    };
  } else if (cleanSlug.includes("winter-glove") || cleanSlug.includes("waterproof-glove")) {
    regexRule = {
      $or: [{ name: /winter|waterproof|rain/i }, { magentoCategories: /winter|waterproof/i }],
      $and: [{ $or: [{ name: /glove/i }, { magentoCategories: /glove/i }] }]
    };
  } else if (cleanSlug.includes("glove")) {
    const keywords = cleanSlug.replace(/-/g, " ").replace(/s$/, "").trim();
    regexRule = {
      $or: [
        { name: new RegExp(keywords.split(" ").join(".*"), "i") },
        { magentoCategories: new RegExp(keywords, "i") }
      ]
    };
  } else if (cleanSlug.includes("tank-bag")) {
    regexRule = {
      $or: [{ magentoCategories: /tank bag/i }, { name: /tank bag/i }]
    };
  } else if (cleanSlug.includes("saddle-bag") || cleanSlug.includes("pannier")) {
    regexRule = {
      $or: [{ magentoCategories: /saddle bag|saddlebag|pannier/i }, { name: /saddle bag|saddlebag|pannier/i }]
    };
  } else if (cleanSlug.includes("tail-bag")) {
    regexRule = {
      $or: [{ magentoCategories: /tail bag|tailbag/i }, { name: /tail bag|tailbag/i }]
    };
  } else if (cleanSlug.includes("top-box") || cleanSlug.includes("top-case")) {
    regexRule = {
      $or: [{ magentoCategories: /top box|top case/i }, { name: /top box|top case/i }]
    };
  } else if (cleanSlug.includes("hydration")) {
    regexRule = {
      $or: [{ magentoCategories: /hydration|water/i }, { name: /hydration|camelbak/i }]
    };
  } else if (cleanSlug.includes("luggage") || cleanSlug.includes("bag")) {
    regexRule = {
      $or: [
        { name: /\b(luggage|bags?|backpacks?|panniers?|tail\s*bag|tank\s*bag|saddle\s*bag|top\s*box)\b/i },
        { magentoCategories: /\b(luggage|bags?|backpacks?|panniers?|tail\s*bag|tank\s*bag|saddle)\b/i }
      ]
    };
  } else if (cleanSlug.includes("touring-pant")) {
    regexRule = {
      $or: [{ name: /touring.*pant/i }, { magentoCategories: /touring.*pant/i }]
    };
  } else if (cleanSlug.includes("riding-jeans")) {
    regexRule = {
      $or: [{ name: /\bjeans?\b/i }, { magentoCategories: /\bjeans?\b/i }]
    };
  } else if (cleanSlug.includes("pant") || cleanSlug.includes("trouser")) {
    regexRule = {
      $or: [
        { name: /\b(pants?|trousers?|jeans)\b/i },
        { magentoCategories: /\b(pants?|trousers?)\b/i }
      ],
      name: { $not: /\b(knee\s*guard|hip\s*protector|knee\s*protector|armour|armor|insert|knee\s*slider)\b/i }
    };
  } else if (cleanSlug.includes("auxiliary-light-filter")) {
    regexRule = {
      $or: [{ magentoCategories: /filter|cover/i }, { name: /filter|cover/i }],
      $and: [{ $or: [{ magentoCategories: /auxiliary|light/i }, { name: /auxiliary|light/i }] }]
    };
  } else if (cleanSlug.includes("auxiliary-light")) {
    regexRule = {
      $or: [{ magentoCategories: /auxiliary light|fog light|driving light/i }, { name: /auxiliary light|fog light|driving light/i }]
    };
  } else if (cleanSlug.includes("clamps-mount") || cleanSlug.includes("mounts")) {
    regexRule = {
      $or: [{ magentoCategories: /clamp|mount|bracket/i }, { name: /clamp|mount|bracket/i }]
    };
  } else if (cleanSlug.includes("wiring-harness") || cleanSlug.includes("switch")) {
    regexRule = {
      $or: [{ magentoCategories: /wiring|harness|switch|relay/i }, { name: /wiring|harness|switch|relay/i }]
    };
  } else if (cleanSlug.includes("off-beat")) {
    regexRule = {
      $or: [{ magentoCategories: /off-beat|off beat/i }, { name: /off-beat|off beat/i }]
    };
  } else if (cleanSlug.includes("performance-parts") || cleanSlug.includes("performance")) {
    regexRule = {
      $or: [{ magentoCategories: /performance/i }, { name: /performance|exhaust|air filter/i }]
    };
  } else if (cleanSlug.includes("rally-tower") || cleanSlug.includes("navigation-tower")) {
    regexRule = {
      $or: [{ magentoCategories: /rally tower|navigation tower|nav tower/i }, { name: /rally tower|navigation tower|nav tower/i }]
    };
  } else if (cleanSlug.includes("bike-cover")) {
    regexRule = {
      $or: [{ magentoCategories: /bike cover|motorcycle cover/i }, { name: /bike cover|motorcycle cover/i }]
    };
  } else if (cleanSlug.includes("chain-care") || cleanSlug.includes("chain-lube")) {
    regexRule = {
      $or: [{ magentoCategories: /chain care|chain lube|chain cleaner/i }, { name: /chain care|chain lube|chain cleaner|chain brush/i }]
    };
  } else if (cleanSlug.includes("accessori")) {
    regexRule = {
      $or: [
        { magentoCategories: /\baccessor(y|ies)|protector|armour|armor\b/i },
        { name: /\b(accessor(y|ies)|cleaner|cover|lock|mount|visor|pinlock|deflector|protector|armour|armor|insert)\b/i }
      ]
    };
  } else if (cleanSlug.includes("women-riding-gear") || cleanSlug.includes("women") || cleanSlug.includes("riding-gear-for-women")) {
    regexRule = {
      $or: [
        { name: /\b(women|womens|lady|ladies)\b/i }, 
        { magentoCategories: /\b(women|womens|lady|ladies|female|riding gear for women)\b/i }, 
        { gender: /^(women|womens|female|lady|ladies)$/i } // strict match to exclude "Male, Female"
      ]
    };
  } else if (cleanSlug.includes("protectors-armour") || cleanSlug.includes("protector") || cleanSlug.includes("armour")) {
    regexRule = {
      $or: [{ name: /protector|armour|armor|insert/i }, { magentoCategories: /protector|armour|armor/i }]
    };
  } else if (cleanSlug.includes("knee-guard") || cleanSlug.includes("knee-slider")) {
    regexRule = {
      $or: [{ name: /knee.*guard|knee.*slider|knee.*brace/i }, { magentoCategories: /knee.*guard|knee.*slider|knee.*brace/i }]
    };
  } else if (cleanSlug.includes("off-road-motocross") || cleanSlug.includes("offroad") || cleanSlug.includes("off-road")) {
    regexRule = {
      $or: [{ name: /off.*road|motocross|dirt|mx/i }, { magentoCategories: /off.*road|motocross|dirt|mx/i }]
    };
  } else if (cleanSlug.includes("riding-gear")) {
    regexRule = {
      $or: [
        { magentoCategories: /riding gear/i },
        { name: /\b(jacket|jackets|glove|gloves|boot|boots|pant|pants)\b/i }
      ]
    };
  } else {
    // Auto-generator fallback
    const exactPhrase = cleanSlug.replace(/-/g, " ").trim();
    const keywords = exactPhrase
      .split(/\s+/)
      .filter((w) => !["motorcycle", "riding", "bike", "for", "online"].includes(w) && w.length > 1);
      
    if (keywords.length > 0) {
      const lookaheads = keywords.map(w => `(?=.*\\b${w})`).join("");
      const andPattern = `^${lookaheads}.*$`;
      
      regexRule = {
        $or: [
          { magentoCategories: new RegExp(exactPhrase, "i") },
          { magentoCategories: new RegExp(andPattern, "i") },
          { name: new RegExp(andPattern, "i") }
        ]
      };
    } else {
      regexRule = {
        $or: [
          { magentoCategories: new RegExp(exactPhrase, "i") },
          { name: new RegExp(exactPhrase, "i") }
        ]
      };
    }
  }

  return {
    $or: [
      regexRule,
      { categorySlugs: cleanSlug }
    ]
  };
}
