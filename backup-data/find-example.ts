import fs from 'fs';
import Papa from 'papaparse';

const CSV_FILE = 'C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv';
const file = fs.readFileSync(CSV_FILE, 'utf8');
const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });

const allSkus = new Set(data.map((r: any) => r.sku));

let foundCount = 0;
for (const r of data as any[]) {
  if (r.upsell_skus) {
    const upsells = r.upsell_skus.split(',').map((s: string) => s.trim()).filter(Boolean);
    for (const u of upsells) {
      if (!allSkus.has(u)) {
        console.log('--------------------------------------------------');
        console.log(`Product in CSV: ${r.name}`);
        console.log(`SKU: ${r.sku}`);
        console.log(`Its 'upsell_skus' column says to show this SKU: ${u}`);
        console.log(`But if you search for SKU '${u}' in the CSV, it DOES NOT EXIST.`);
        foundCount++;
        if (foundCount >= 3) process.exit(0);
      }
    }
  }
}
