import fs from 'fs';
import Papa from 'papaparse';

const file = fs.readFileSync('C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv', 'utf8');
const { data } = Papa.parse(file, { header: true, skipEmptyLines: true });

let foundLWH = false;
let foundHSN = false;

for (const row of data as any[]) {
  if (row.additional_attributes) {
    if (row.additional_attributes.toLowerCase().includes('length') || 
        row.additional_attributes.toLowerCase().includes('width') || 
        row.additional_attributes.toLowerCase().includes('height')) {
      console.log('Found LWH in attributes:', row.additional_attributes);
      foundLWH = true;
    }
    if (row.additional_attributes.toLowerCase().includes('hsn')) {
      console.log('Found HSN in attributes:', row.additional_attributes);
      foundHSN = true;
    }
  }
  if (foundLWH && foundHSN) break;
}

if (!foundLWH) console.log('No LWH found in additional_attributes');
if (!foundHSN) console.log('No HSN found in additional_attributes');
