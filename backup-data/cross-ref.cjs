const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function crossRef() {
  const csvPath = path.join(__dirname, 'csv_nov.csv');
  const progressPath = path.join(__dirname, '.sync-progress.json');

  const uploadedArray = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  const uploadedSet = new Set(uploadedArray.map(k => k.toLowerCase().replace(/\\/g, '/')));

  let csvTotal = 0;
  let matched = 0;
  let missing = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      const baseImg = (row.base_image || '').trim();
      const addImgs = (row.additional_images || '').trim();

      const allRowImgs = [];
      if (baseImg && baseImg !== 'no_selection') allRowImgs.push(baseImg);
      if (addImgs) {
        addImgs.split(',').forEach(i => {
          const c = i.trim();
          if (c && c !== 'no_selection') allRowImgs.push(c);
        });
      }

      for (const img of allRowImgs) {
        csvTotal++;
        let clean = img.replace(/^[\/\\]+/, '').replace(/^catalog[\/\\]product[\/\\]/i, '').replace(/\\/g, '/').toLowerCase();
        let withWebp = clean.replace(/\.[^/.]+$/, '') + '.webp';
        let key = 'catalog/product/' + withWebp;

        if (uploadedSet.has(key) || uploadedSet.has(withWebp) || uploadedSet.has(clean)) {
          matched++;
        } else {
          missing.push({ sku: row.sku, img, expectedKey: key });
        }
      }
    })
    .on('end', () => {
      console.log('=== CROSS-REFERENCE RESULTS ===');
      console.log(`- Total Image References checked: ${csvTotal}`);
      console.log(`- Successfully Matched in CloudFront Upload: ${matched} (${((matched/csvTotal)*100).toFixed(2)}%)`);
      console.log(`- Missing: ${missing.length}`);
      if (missing.length > 0) {
        console.log(`Sample missing (first 10):`);
        missing.slice(0, 10).forEach(m => console.log(`  SKU: ${m.sku} | Image: ${m.img}`));
      }
    });
}

crossRef().catch(console.error);
