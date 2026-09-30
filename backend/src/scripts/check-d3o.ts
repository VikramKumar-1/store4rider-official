import fs from "fs";
import Papa from "papaparse";

const csvPath = "C:\\Users\\vikur\\Downloads\\store4riders\\backup-data\\Clancsv1.csv";
const content = fs.readFileSync(csvPath, "utf-8");
const { data } = Papa.parse<any>(content, { header: true, skipEmptyLines: true });

const product = data.find((r: any) => r.sku?.trim() === "SCOUTWP-D3O" || r.name?.includes("D3O"));
if (product) {
  console.log("✅ FOUND IN CSV!");
  console.log("Name:", product.name);
  console.log("SKU:", product.sku);
  console.log("Related:", product.related_skus);
  console.log("Upsell:", product.upsell_skus);
} else {
  console.log("❌ NOT FOUND");
}
