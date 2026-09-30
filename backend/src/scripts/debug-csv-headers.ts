import fs from 'fs';
import Papa from 'papaparse';

const CSV_FILE_PATH = 'C:/Users/vikur/Downloads/All product export csv-17.9.26.csv';

const content = fs.readFileSync(CSV_FILE_PATH, 'utf8');
const parsed = Papa.parse(content, { header: true, preview: 1 });
const headers = parsed.meta.fields || [];

console.log("CSV Headers matching 'skus':");
console.log(headers.filter(h => h.includes('sku')));
