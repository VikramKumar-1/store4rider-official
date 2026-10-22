import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const csvPath = path.join(process.cwd(), 'backup-data', 'latestcsv.csv');
const fileStream = fs.createReadStream(csvPath, 'utf8');

const motorcycleModels = new Set<string>();
let totalWithModel = 0;

Papa.parse(fileStream, {
  header: true,
  step: (row) => {
    const data: any = row.data;
    const attrs = data.additional_attributes || '';
    const match = attrs.match(/motorcycle_model="([^"]+)"/);
    if (match) {
      motorcycleModels.add(match[1]);
      totalWithModel++;
    }
  },
  complete: () => {
    console.log(`Total rows with motorcycle_model: ${totalWithModel}`);
    console.log(`Distinct motorcycle models (${motorcycleModels.size}):`);
    Array.from(motorcycleModels).slice(0, 30).forEach(m => console.log(' -', m));
  }
});
