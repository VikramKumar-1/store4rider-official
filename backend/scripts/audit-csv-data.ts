import fs from "fs";
import path from "path";
import readline from "readline";

/**
 * Rapid CSV Audit Script
 * Reads 'Edited product csv of all brands.csv' and extracts ALL unique:
 * 1. attribute_set_code values
 * 2. categories paths
 * 3. brands in additional_attributes
 * 4. product_type breakdown
 */

const csvFilePath = path.resolve(process.cwd(), "backup-data", "latestcsv", "Edited product csv of all brands.csv");

async function auditCsv() {
  console.log("--------------------------------------------------");
  console.log("AUDITING CSV:", csvFilePath);
  console.log("--------------------------------------------------");

  if (!fs.existsSync(csvFilePath)) {
    console.error("File not found at:", csvFilePath);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(csvFilePath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const attributeSets = new Set<string>();
  const productTypes = new Set<string>();
  const brands = new Set<string>();
  const rootCategories = new Set<string>();
  const subCategories = new Set<string>();

  let isHeader = true;
  let headerIndexes: Record<string, number> = {};
  let totalRows = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    // Simple CSV parser for quoted strings
    const matches: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        matches.push(cur.trim());
        cur = "";
      } else {
        cur += char;
      }
    }
    matches.push(cur.trim());

    if (isHeader) {
      matches.forEach((col, idx) => {
        headerIndexes[col] = idx;
      });
      isHeader = false;
      continue;
    }

    totalRows++;

    const attrSet = matches[headerIndexes["attribute_set_code"]] || "";
    if (attrSet) attributeSets.add(attrSet);

    const prodType = matches[headerIndexes["product_type"]] || "";
    if (prodType) productTypes.add(prodType);

    // Extract brands from additional_attributes
    const addAttrs = matches[headerIndexes["additional_attributes"]] || "";
    const brandMatch = addAttrs.match(/brand="([^"]+)"/i);
    if (brandMatch && brandMatch[1]) {
      brands.add(brandMatch[1].trim());
    }

    // Extract categories
    const cats = matches[headerIndexes["categories"]] || "";
    if (cats) {
      const paths = cats.split(",");
      for (const p of paths) {
        const segs = p.replace(/\\\//g, "/").split("/").map(s => s.trim()).filter(Boolean);
        const cleanSegs = segs.filter(s => !s.toLowerCase().includes("root") && !s.toLowerCase().includes("default"));
        if (cleanSegs.length > 0) {
          rootCategories.add(cleanSegs[0]);
          if (cleanSegs.length > 1) {
            subCategories.add(`${cleanSegs[0]} > ${cleanSegs[1]}`);
          }
        }
      }
    }
  }

  console.log("\n[1] TOTAL ROWS IN CSV:", totalRows);

  console.log("\n[2] ALL UNIQUE ATTRIBUTE SET CODES (Column C):");
  Array.from(attributeSets).sort().forEach(a => console.log("  -", a));

  console.log("\n[3] PRODUCT TYPES (Column D):");
  Array.from(productTypes).forEach(pt => console.log("  -", pt));

  console.log("\n[4] ALL BRANDS FOUND (From Column AU):");
  Array.from(brands).sort().forEach(b => console.log("  -", b));

  console.log("\n[5] ALL ROOT CATEGORIES FOUND (From Column E):");
  Array.from(rootCategories).sort().forEach(rc => console.log("  -", rc));

  console.log("\n[6] SAMPLE OF SUB-CATEGORIES FOUND:");
  Array.from(subCategories).slice(0, 30).forEach(sc => console.log("  -", sc));

  console.log("\n--------------------------------------------------");
  console.log("AUDIT COMPLETE!");
  console.log("--------------------------------------------------");
}

auditCsv().catch(console.error);
