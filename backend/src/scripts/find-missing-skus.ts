/**
 * Checks if specific SKUs exist in the Magento CSV as standalone products.
 */
import fs from "fs";
import Papa from "papaparse";

const MISSING_SKUS = [
  "TRCRG", "RDMG", "AMI", "RCTB",
  "AVSRG", "I-RST-GL-ARMG", "BBGSUG", "REBG",
  "RURRS", "ATTMB", "REVMB", "RECWB"
];

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: pnpm tsx backend/src/scripts/find-missing-skus.ts <csv-path>");
  process.exit(1);
}

console.log(`\n📂 Reading CSV: ${csvPath}\n`);
const content = fs.readFileSync(csvPath, "utf-8");
const { data } = Papa.parse<any>(content, { header: true, skipEmptyLines: true });

console.log(`📊 Total rows: ${data.length}\n`);
console.log("🔍 Searching for missing SKUs...\n");

for (const sku of MISSING_SKUS) {
  const row = data.find((r: any) => r.sku?.trim() === sku);
  if (row) {
    console.log(`✅ FOUND   [${sku}] → name: "${row.name}" | type: ${row.product_type} | online: ${row.product_online}`);
  } else {
    console.log(`❌ MISSING [${sku}] → not in CSV as standalone product`);
  }
}
