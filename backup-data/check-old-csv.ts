import fs from 'fs';
import Papa from 'papaparse';

const file = fs.readFileSync('C:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv', 'utf8');
const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });

const matches = (data as any[]).filter(r => r.sku && r.sku.toLowerCase().includes('exp-dry'));
console.log(`Found ${matches.length} SKUs containing 'exp-dry':`);
matches.forEach(m => console.log(`- ${m.sku} | Price: ${m.price} | Name: ${m.name}`));

const upsellMatches = (data as any[]).filter(r => r.sku === 'ISTB');
console.log(`\nFound ISTB? ${upsellMatches.length > 0 ? 'YES' : 'NO'}`);
