import fs from 'fs';
import Papa from 'papaparse';

const file = fs.readFileSync('C:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv', 'utf8');
const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });
const product = (data as any[]).find(r => r.sku === 'ISTB');
if (product) {
  console.log('NAME FOUND:', product.name);
} else {
  console.log('Not in old CSV either.');
}
