/**
 * Quick CSV Analysis Script
 * Analyzes the new CSV to understand exact field mapping for robust import.
 */
import fs from 'fs';
import Papa from 'papaparse';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const CSV_FILE_PATH = 'C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv';

interface Stats {
  totalRows: number;
  productTypes: Record<string, number>;
  visibilities: Record<string, number>;
  withRelatedSkus: number;
  withUpsellSkus: number;
  withCrosssellSkus: number;
  withAdditionalImages: number;
  withDescription: number;
  withShortDesc: number;
  withSpecialPrice: number;
  withPrice: number;
  withoutPrice: number;
  zeroPrice: number;
  configurableWithoutPrice: number;
  withConfigVariations: number;
  withConfigLabels: number;
  withShipCost: number;
  withGender: number;
  withBrand: number;
  withSizeChart: number;
  withCountry: number;
  sampleRelated: any[];
  sampleConfigurable: any[];
  sampleChildWithSpecialPrice: any[];
  sampleAttributes: string[];
  allAttributeKeys: Set<string>;
}

const stats: Stats = {
  totalRows: 0,
  productTypes: {},
  visibilities: {},
  withRelatedSkus: 0,
  withUpsellSkus: 0,
  withCrosssellSkus: 0,
  withAdditionalImages: 0,
  withDescription: 0,
  withShortDesc: 0,
  withSpecialPrice: 0,
  withPrice: 0,
  withoutPrice: 0,
  zeroPrice: 0,
  configurableWithoutPrice: 0,
  withConfigVariations: 0,
  withConfigLabels: 0,
  withShipCost: 0,
  withGender: 0,
  withBrand: 0,
  withSizeChart: 0,
  withCountry: 0,
  sampleRelated: [],
  sampleConfigurable: [],
  sampleChildWithSpecialPrice: [],
  sampleAttributes: [],
  allAttributeKeys: new Set(),
};

function parseAdditionalAttributes(attrStr: string): Record<string, string> {
  if (!attrStr) return {};
  const result: Record<string, string> = {};
  // Match key="value" or key=value patterns
  const regex = /(\w+)="([^"]*(?:""[^"]*)*)"|(\w+)=([^,]*)/g;
  let match;
  while ((match = regex.exec(attrStr)) !== null) {
    const key = match[1] || match[3];
    const value = match[2] || match[4];
    if (key) {
      result[key] = value?.replace(/""/g, '"') || '';
    }
  }
  return result;
}

const fileStream = fs.createReadStream(CSV_FILE_PATH, 'utf8');

Papa.parse(fileStream, {
  header: true,
  skipEmptyLines: true,
  step: (results) => {
    const row: any = results.data;
    stats.totalRows++;

    // Product type
    const pt = row.product_type || '(empty)';
    stats.productTypes[pt] = (stats.productTypes[pt] || 0) + 1;

    // Visibility
    const vis = row.visibility || '(empty)';
    stats.visibilities[vis] = (stats.visibilities[vis] || 0) + 1;

    // Related/Upsell/Crosssell
    if (row.related_skus?.trim()) stats.withRelatedSkus++;
    if (row.upsell_skus?.trim()) stats.withUpsellSkus++;
    if (row.crosssell_skus?.trim()) stats.withCrosssellSkus++;

    // Images
    if (row.additional_images?.trim()) stats.withAdditionalImages++;
    if (row.description?.trim()) stats.withDescription++;
    if (row.short_description?.trim()) stats.withShortDesc++;

    // Price
    const price = parseFloat(row.price);
    const sp = parseFloat(row.special_price);
    if (!isNaN(price) && price > 0) stats.withPrice++;
    else if (row.price === '' || row.price === undefined || row.price === null) stats.withoutPrice++;
    else if (price === 0) stats.zeroPrice++;

    if (row.product_type === 'configurable' && (isNaN(price) || price === 0)) stats.configurableWithoutPrice++;
    if (!isNaN(sp) && sp > 0) stats.withSpecialPrice++;

    // Config variations
    if (row.configurable_variations?.trim()) stats.withConfigVariations++;
    if (row.configurable_variation_labels?.trim()) stats.withConfigLabels++;

    // Additional attributes
    if (row.additional_attributes?.trim()) {
      const attrs = parseAdditionalAttributes(row.additional_attributes);
      Object.keys(attrs).forEach(k => stats.allAttributeKeys.add(k));
      if (attrs.ship_cost) stats.withShipCost++;
      if (attrs.gender) stats.withGender++;
      if (attrs.brand) stats.withBrand++;
      if (attrs.size_chart) stats.withSizeChart++;
    }

    if (row.country_of_manufacture?.trim()) stats.withCountry++;

    // Samples
    if (row.related_skus?.trim() && stats.sampleRelated.length < 2) {
      stats.sampleRelated.push({
        sku: row.sku,
        related_skus: row.related_skus,
        upsell_skus: row.upsell_skus,
        crosssell_skus: row.crosssell_skus,
      });
    }

    if (row.product_type === 'configurable' && row.configurable_variations?.trim() && stats.sampleConfigurable.length < 2) {
      stats.sampleConfigurable.push({
        sku: row.sku,
        name: row.name,
        price: row.price,
        special_price: row.special_price,
        qty: row.qty,
        is_in_stock: row.is_in_stock,
        configurable_variations: row.configurable_variations?.substring(0, 500),
        configurable_variation_labels: row.configurable_variation_labels,
        additional_attributes: row.additional_attributes?.substring(0, 300),
      });
    }

    if (row.visibility === 'Not Visible Individually' && row.special_price?.trim() && parseFloat(row.special_price) > 0 && stats.sampleChildWithSpecialPrice.length < 3) {
      stats.sampleChildWithSpecialPrice.push({
        sku: row.sku,
        price: row.price,
        special_price: row.special_price,
        qty: row.qty,
        is_in_stock: row.is_in_stock,
      });
    }

    if (row.additional_attributes?.trim() && stats.sampleAttributes.length < 3) {
      stats.sampleAttributes.push(row.additional_attributes.substring(0, 400));
    }
  },
  complete: () => {
    console.log('\n===== CSV ANALYSIS REPORT =====\n');
    console.log(`Total Rows: ${stats.totalRows}`);
    console.log('\n--- Product Types ---');
    console.log(stats.productTypes);
    console.log('\n--- Visibility ---');
    console.log(stats.visibilities);
    console.log('\n--- Counts ---');
    console.log(`With Price (>0): ${stats.withPrice}`);
    console.log(`Without Price (empty): ${stats.withoutPrice}`);
    console.log(`Zero Price: ${stats.zeroPrice}`);
    console.log(`Configurable without price: ${stats.configurableWithoutPrice}`);
    console.log(`With Special Price (>0): ${stats.withSpecialPrice}`);
    console.log(`With Description: ${stats.withDescription}`);
    console.log(`With Short Desc: ${stats.withShortDesc}`);
    console.log(`With Additional Images: ${stats.withAdditionalImages}`);
    console.log(`With Config Variations: ${stats.withConfigVariations}`);
    console.log(`With Config Labels: ${stats.withConfigLabels}`);
    console.log(`With Related SKUs: ${stats.withRelatedSkus}`);
    console.log(`With Upsell SKUs: ${stats.withUpsellSkus}`);
    console.log(`With Crosssell SKUs: ${stats.withCrosssellSkus}`);
    console.log(`With Ship Cost: ${stats.withShipCost}`);
    console.log(`With Gender: ${stats.withGender}`);
    console.log(`With Brand: ${stats.withBrand}`);
    console.log(`With Size Chart: ${stats.withSizeChart}`);
    console.log(`With Country: ${stats.withCountry}`);

    console.log('\n--- All Attribute Keys Found ---');
    console.log([...stats.allAttributeKeys].sort().join(', '));

    console.log('\n--- Sample Related/Upsell ---');
    stats.sampleRelated.forEach(s => console.log(JSON.stringify(s, null, 2)));

    console.log('\n--- Sample Configurable Products ---');
    stats.sampleConfigurable.forEach(s => console.log(JSON.stringify(s, null, 2)));

    console.log('\n--- Sample Child with Special Price ---');
    stats.sampleChildWithSpecialPrice.forEach(s => console.log(JSON.stringify(s, null, 2)));

    console.log('\n--- Sample Additional Attributes ---');
    stats.sampleAttributes.forEach((s, i) => console.log(`[${i}] ${s}`));
  },
  error: (err: any) => {
    console.error('Parse error:', err);
  },
});
