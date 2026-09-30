/**
 * List all zero-price products with their child details
 */
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const CSV_FILE_PATH = 'C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv';

const zeroPriceSkus = [
  'REDB2SP','RETBV2','RESB','RKMJ','DHBR','JDBRE','ASDCBGH',
  'RH2GORJ','RSWJW','ARMXMH','FGME3RJ','FFR2RG','FRMMB',
  'FXHFMF-Royal-Enfield-Meteor','FM733/20-KTM-RC','FM995/04','HV400/GL200/GL100'
];

// Build full index
const allRows = new Map<string, any>();

const fileStream = fs.createReadStream(CSV_FILE_PATH, 'utf8');
Papa.parse(fileStream, {
  header: true,
  skipEmptyLines: true,
  step: (results) => {
    const row: any = results.data;
    if (row.sku) allRows.set(row.sku, row);
  },
  complete: () => {
    console.log(`Total rows indexed: ${allRows.size}\n`);
    console.log('=== 17 ZERO-PRICE PRODUCTS — DETAILED ANALYSIS ===\n');

    let idx = 0;
    for (const sku of zeroPriceSkus) {
      idx++;
      const row = allRows.get(sku);
      if (!row) {
        console.log(`${idx}. ${sku} — NOT FOUND IN CSV\n`);
        continue;
      }

      console.log(`${idx}. SKU: ${sku}`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Parent Price: [${row.price || 'EMPTY'}]`);
      console.log(`   Parent Special Price: [${row.special_price || 'EMPTY'}]`);

      if (!row.configurable_variations || row.configurable_variations.trim() === '') {
        console.log(`   ❌ REASON: No configurable_variations defined (empty field)`);
        console.log('');
        continue;
      }

      const variations = row.configurable_variations.split('|');
      let foundChildren = 0;
      let missingChildren = 0;

      for (const v of variations) {
        const skuMatch = v.match(/sku=([^,|]+)/);
        if (!skuMatch) continue;
        const childSku = skuMatch[1];
        const childRow = allRows.get(childSku);

        if (childRow) {
          foundChildren++;
          console.log(`   ✅ Child: ${childSku} | Price=₹${childRow.price || '0'} | Qty=${childRow.qty} | InStock=${childRow.is_in_stock}`);
        } else {
          missingChildren++;
          console.log(`   ❌ Child: ${childSku} — NOT FOUND IN CSV`);
        }
      }

      if (missingChildren > 0 && foundChildren === 0) {
        console.log(`   ❌ REASON: ALL ${missingChildren} children missing from CSV`);
      } else if (missingChildren > 0) {
        console.log(`   ⚠️  REASON: ${missingChildren} children missing, ${foundChildren} found but all have ₹0 price`);
      } else {
        console.log(`   ⚠️  REASON: All ${foundChildren} children found but all have ₹0 price`);
      }
      console.log('');
    }
  }
});
