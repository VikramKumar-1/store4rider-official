const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

async function checkCsv() {
  const csvPath = path.join(__dirname, 'csv_nov.csv');
  let productCount = 0;
  const skus = new Set();
  const images = new Set();
  const productsWithImages = new Set();
  const productsWithoutImages = [];

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      productCount++;
      const sku = (row.sku || '').trim();
      if (sku) skus.add(sku);

      const baseImg = (row.base_image || '').trim();
      const addImgs = (row.additional_images || '').trim();

      let hasImg = false;
      if (baseImg && baseImg !== 'no_selection') {
        images.add(baseImg.replace(/^\/+/, ''));
        hasImg = true;
      }
      if (addImgs) {
        addImgs.split(',').forEach(img => {
          const clean = img.trim().replace(/^\/+/, '');
          if (clean && clean !== 'no_selection') {
            images.add(clean);
            hasImg = true;
          }
        });
      }

      if (hasImg) {
        productsWithImages.add(sku);
      } else {
        productsWithoutImages.push({ sku, name: row.name });
      }
    })
    .on('end', () => {
      console.log('=== EXACT CSV_NOV.CSV ANALYSIS ===');
      console.log(`- Total Product Rows in CSV: ${productCount}`);
      console.log(`- Unique SKUs in CSV: ${skus.size}`);
      console.log(`- Total Unique Images referenced in CSV: ${images.size}`);
      console.log(`- Products in CSV WITH images: ${productsWithImages.size}`);
      console.log(`- Products in CSV WITHOUT images: ${productsWithoutImages.length}`);
      if (productsWithoutImages.length > 0) {
        console.log(`\nSample Products without images in original Magento CSV:`);
        productsWithoutImages.slice(0, 10).forEach(p => console.log(`  * SKU: ${p.sku} | Name: "${p.name}"`));
      }
    });
}

checkCsv().catch(console.error);
