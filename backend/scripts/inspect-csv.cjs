const fs = require('fs');
const Papa = require('papaparse');

const fileStream = fs.createReadStream('backup-data/latestcsv.csv');

const attributeSets = new Map();
const taxClasses = new Map();
const sampleCategories = new Set();
const additionalKeys = new Set();
const sampleProductsByAttr = new Map();
let rowCount = 0;

Papa.parse(fileStream, {
  header: true,
  skipEmptyLines: true,
  step: function (results) {
    rowCount++;
    const row = results.data;
    const attr = row.attribute_set_code;
    const tax = row.tax_class_name;
    const cat = row.categories;
    const addAttrs = row.additional_attributes;

    if (attr) {
      attributeSets.set(attr, (attributeSets.get(attr) || 0) + 1);
      if (!sampleProductsByAttr.has(attr)) {
        sampleProductsByAttr.set(attr, {
          sku: row.sku,
          name: row.name,
          category: cat,
          tax: tax,
          additional: addAttrs ? addAttrs.slice(0, 150) : '',
        });
      }
    }
    if (tax) {
      taxClasses.set(tax, (taxClasses.get(tax) || 0) + 1);
    }
    if (cat && sampleCategories.size < 20) {
      sampleCategories.add(cat);
    }
    if (addAttrs) {
      const pairs = addAttrs.split(',');
      for (const p of pairs) {
        const [k] = p.split('=');
        if (k) additionalKeys.add(k.trim());
      }
    }
  },
  complete: function () {
    console.log('=== TOTAL PRODUCTS PARSED ===', rowCount);

    console.log('\n=== REAL ATTRIBUTE SETS IN CSV (with product count) ===');
    for (const [k, v] of attributeSets.entries()) {
      console.log(`  - "${k}": ${v} products`);
    }

    console.log('\n=== REAL TAX CLASSES IN CSV ===');
    for (const [k, v] of taxClasses.entries()) {
      console.log(`  - "${k}": ${v} products`);
    }

    console.log('\n=== SAMPLE PRODUCT PER ATTRIBUTE SET ===');
    for (const [k, sample] of sampleProductsByAttr.entries()) {
      console.log(`\n[Attribute Set: ${k}]`);
      console.log(`  SKU: ${sample.sku}`);
      console.log(`  Name: ${sample.name}`);
      console.log(`  Tax Class: ${sample.tax}`);
      console.log(`  Categories: ${sample.category}`);
      console.log(`  Additional Attributes: ${sample.additional}`);
    }

    console.log('\n=== ATTRIBUTE KEYS FOUND IN additional_attributes (first 50) ===');
    console.log([...additionalKeys].slice(0, 50));
  },
});
