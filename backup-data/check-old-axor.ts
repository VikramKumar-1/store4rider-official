import fs from 'fs';
import Papa from 'papaparse';

const file = fs.readFileSync('C:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv', 'utf8');
const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });
const matches = (data as any[]).filter(r => r.name && r.name.toLowerCase().includes('axor apex scratch'));
if (matches.length > 0) {
  console.log('FOUND IN OLD CSV:');
  matches.forEach(m => console.log(m.sku, m.name, m.product_type));
} else {
  console.log('Not in old CSV either.');
}
