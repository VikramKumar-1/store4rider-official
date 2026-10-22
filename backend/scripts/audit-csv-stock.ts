import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const csvPath = path.join(process.cwd(), 'backup-data', 'latestcsv.csv');
const fileStream = fs.createReadStream(csvPath, 'utf8');

let total = 0;
let inStock1 = 0;
let inStock0 = 0;
let qtyGt0 = 0;
let qtyEq0 = 0;
let qtyEmpty = 0;
let bothInStockAndQty = 0;
let inStock1ButQty0 = 0;

Papa.parse(fileStream, {
  header: true,
  step: (row) => {
    total++;
    const d: any = row.data;
    const isStock = String(d.is_in_stock).trim();
    const q = parseFloat(d.qty || '0');

    if (isStock === '1') inStock1++;
    else inStock0++;

    if (q > 0) qtyGt0++;
    else if (d.qty === '' || d.qty === undefined) qtyEmpty++;
    else qtyEq0++;

    if (isStock === '1' && q > 0) bothInStockAndQty++;
    if (isStock === '1' && q <= 0) inStock1ButQty0++;
  },
  complete: () => {
    console.log(`Total rows in CSV: ${total}`);
    console.log(`is_in_stock == 1: ${inStock1}`);
    console.log(`is_in_stock == 0: ${inStock0}`);
    console.log(`qty > 0: ${qtyGt0}`);
    console.log(`qty == 0: ${qtyEq0}`);
    console.log(`qty empty: ${qtyEmpty}`);
    console.log(`is_in_stock == 1 AND qty > 0: ${bothInStockAndQty}`);
    console.log(`is_in_stock == 1 BUT qty <= 0: ${inStock1ButQty0}`);
  }
});
