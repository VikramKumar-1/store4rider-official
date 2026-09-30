import fs from 'fs';
import Papa from 'papaparse';

const CSV_FILE_PATH = 'C:/Users/vikur/Downloads/All product export csv-17.9.26.csv';

function run() {
  console.log(`Reading CSV file: ${CSV_FILE_PATH}`);
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`File not found!`);
    return;
  }

  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  const parsed = Papa.parse(csvContent, { 
    header: true, 
    skipEmptyLines: true,
  });
  
  const rows = parsed.data as any[];
  console.log(`Total rows in CSV: ${rows.length}`);

  let found = false;
  for (const row of rows) {
    const name = row.name || '';
    if (name.toLowerCase().includes('smk agnar')) {
      console.log(`\n--- FOUND IN CSV ---`);
      console.log(`Name: ${row.name}`);
      console.log(`SKU: ${row.sku}`);
      console.log(`Product Type: ${row.product_type}`);
      console.log(`Store View Code: "${row.store_view_code}"`);
      found = true;
    }
  }

  if (!found) {
    console.log(`\n--- NOT FOUND IN CSV ---`);
    console.log(`The product SMK Agnar is completely missing from the CSV export file.`);
  }
}

run();
