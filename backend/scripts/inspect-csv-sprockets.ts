import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const csvPath = path.join(process.cwd(), 'backup-data', 'latestcsv.csv');
console.log('Reading CSV:', csvPath);

const fileStream = fs.createReadStream(csvPath, 'utf8');

const matches: any[] = [];
Papa.parse(fileStream, {
  header: true,
  step: (row) => {
    const data: any = row.data;
    const name = data.name || '';
    const sku = data.sku || '';
    if (/sprocket/i.test(name) || /sprocket/i.test(sku) || /HOR-347/i.test(sku)) {
      matches.push({
        sku: data.sku,
        name: data.name,
        brand: data.brand,
        additional_attributes: data.additional_attributes,
        categories: data.categories,
      });
    }
  },
  complete: () => {
    console.log(`Found ${matches.length} sprocket rows in latestcsv.csv:`);
    matches.forEach(m => console.log(m));
  }
});
