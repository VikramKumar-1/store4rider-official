import fs from "fs";
import Papa from "papaparse";

const csvPath = "C:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv";
const content = fs.readFileSync(csvPath, "utf-8");
const { data } = Papa.parse<any>(content, { header: true, skipEmptyLines: true });

const rows = data.filter((r: any) => r.sku?.includes("RVPPBLU"));

console.log(`Found ${rows.length} rows for RVPPBLU`);
rows.forEach((row: any) => {
  console.log(`SKU: ${row.sku} | Type: ${row.product_type} | Price: ${row.price} | Special: ${row.special_price}`);
});
