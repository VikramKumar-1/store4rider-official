// npx tsx src/scripts/sync-csv-to-db.ts
/*
  Suggested package.json script:
  "scripts": {
    "sync:csv": "tsx src/scripts/sync-csv-to-db.ts"
  }
*/

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Papa from 'papaparse';
import mongoose from 'mongoose';

// Load environment variables before any other imports
dotenv.config({ path: path.join(process.cwd(), '.env') });

const CSV_FILE_PATH = 'c:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv';
const BATCH_SIZE = 100;
const S3_BASE_URL = 'https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product';

/**
 * Extracts a specific attribute value from Magento additional_attributes string.
 * Format after CSV parsing: key1="value1",key2="value2"
 * Handles HTML values containing commas, quotes, etc. (like size_chart_01)
 */
function extractAttribute(attrString: string, key: string): string | null {
  if (!attrString) return null;
  
  // Find the key= pattern, ensuring it's at start or after a comma
  const keyPattern = key + '=';
  let keyIndex = -1;
  let searchFrom = 0;
  
  while (searchFrom < attrString.length) {
    const idx = attrString.indexOf(keyPattern, searchFrom);
    if (idx === -1) return null;
    // Ensure it's at start or preceded by comma
    if (idx === 0 || attrString[idx - 1] === ',') {
      keyIndex = idx;
      break;
    }
    searchFrom = idx + 1;
  }
  
  if (keyIndex === -1) return null;
  
  const valueStart = keyIndex + keyPattern.length;
  
  // Find the next ,validKey= pattern (Magento attribute codes are lowercase + underscores + digits)
  const remaining = attrString.substring(valueStart);
  const nextKeyMatch = remaining.match(/,([a-z_][a-z0-9_]*)=/);
  const rawValue = nextKeyMatch 
    ? remaining.substring(0, nextKeyMatch.index!) 
    : remaining;
  
  // Strip surrounding quotes
  let value = rawValue.trim();
  value = value.replace(/^"+/, '').replace(/"+$/, '');
  
  return value || null;
}

/**
 * Combines base_image and additional_images into the DB schema format
 */
function buildImages(row: any) {
  const images: any[] = [];
  let idCounter = 0;

  if (row.base_image && row.base_image.trim() !== '') {
    images.push({
      id: String(idCounter++),
      url: S3_BASE_URL + row.base_image.trim(),
      altText: row.base_image_label ? row.base_image_label.trim() : ''
    });
  }

  if (row.additional_images && row.additional_images.trim() !== '') {
    const additional = row.additional_images.split(',');
    const labels = row.additional_image_labels ? row.additional_image_labels.split(',') : [];

    for (let i = 0; i < additional.length; i++) {
      const imgPath = additional[i].trim();
      if (imgPath) {
        images.push({
          id: String(idCounter++),
          url: S3_BASE_URL + imgPath,
          altText: labels[i] ? labels[i].trim() : ''
        });
      }
    }
  }

  return images.length > 0 ? images : undefined;
}

async function runMigration() {
  console.log('Connecting to database...');
  const { connectToDatabase } = await import('../core/database/connection');
  const { ProductModel } = await import('../modules/product/product.model');
  
  await connectToDatabase();
  console.log('Connected.');

  console.log(`Reading CSV file: ${CSV_FILE_PATH}`);
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`File not found: ${CSV_FILE_PATH}`);
    process.exit(1);
  }

  // Read and parse CSV synchronously for simplicity (assumes file fits in memory)
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  const parsed = Papa.parse(csvContent, { 
    header: true, 
    skipEmptyLines: true,
    // PapaParse automatically handles quotes and commas inside quotes
  });
  const rows = parsed.data as any[];

  console.log(`Total rows in CSV: ${rows.length}`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;

  let batch: any[] = [];
  let processedCount = 0;

  for (const row of rows) {
    processedCount++;

    // Skip overrides (store-specific values) and empty SKUs
    if (row.store_view_code && row.store_view_code.trim() !== '') {
      totalSkipped++;
      continue;
    }
    
    const sku = row.sku?.trim();
    if (!sku) {
      totalSkipped++;
      continue;
    }

    const updateData: any = {};
    
    // Direct mappings (only map if present and non-empty)
    if (row.name?.trim()) updateData.name = row.name.trim();
    if (row.description?.trim()) updateData.description = row.description.trim();
    if (row.short_description?.trim()) updateData.shortDescription = row.short_description.trim();
    if (row.url_key?.trim()) {
      updateData.slug = row.url_key.trim();
    } else if (row.name?.trim()) {
      // Append SKU to slug to guarantee uniqueness (child variants share names)
      const baseSlug = row.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      updateData.slug = `${baseSlug}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    } else {
      updateData.slug = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    if (row.price?.trim()) updateData.basePrice = Number(row.price);
    else updateData.basePrice = 0; // Fallback for required field
    
    if (row.special_price?.trim()) updateData.specialPrice = Number(row.special_price);
    if (row.weight?.trim()) updateData.weight = Number(row.weight);
    if (row.is_in_stock?.trim()) updateData.stockStatus = Number(row.is_in_stock);
    if (row.product_type?.trim()) updateData.productType = row.product_type.trim();
    if (row.categories?.trim()) updateData.magentoCategories = row.categories.trim();
    if (row.meta_title?.trim()) updateData.metaTitle = row.meta_title.trim();
    if (row.meta_keywords?.trim()) updateData.metaKeywords = row.meta_keywords.trim();
    if (row.meta_description?.trim()) updateData.metaDescription = row.meta_description.trim();
    
    if (row.related_skus?.trim()) {
      updateData.relatedSkus = row.related_skus.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    if (row.upsell_skus?.trim()) {
      updateData.upsellSkus = row.upsell_skus.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    if (row.configurable_variations?.trim()) {
      updateData.configurableVariations = row.configurable_variations.trim();
    }
    
    if (row.configurable_variation_labels?.trim()) {
      updateData.configurableVariationLabels = row.configurable_variation_labels.trim();
    }

    if (row.crosssell_skus?.trim()) {
      updateData.crosssellSkus = row.crosssell_skus.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    if (row.qty?.trim()) {
      updateData.qty = Number(row.qty);
    }

    if (row.country_of_manufacture?.trim()) {
      updateData.countryOfManufacture = row.country_of_manufacture.trim();
    }

    if (row.attribute_set_code?.trim()) {
      updateData.attributeSetCode = row.attribute_set_code.trim();
    }

    // Visibility → status mapping
    // "Catalog, Search" = visible in listings → published
    // "Not Visible Individually" = child variant → draft (hidden from listings)
    const visibility = row.visibility?.trim();
    const productOnline = row.product_online?.trim();
    
    // product_online: 1=Enabled, 2=Disabled in Magento
    if (productOnline === '2' || productOnline === '0') {
      updateData.status = 'archived';
    } else if (visibility) {
      if (visibility.includes('Catalog') || visibility.includes('Search')) {
        updateData.status = 'published';
      } else if (visibility === 'Not Visible Individually') {
        updateData.status = 'draft';
      }
    }

    // Additional attributes — extract specific keys robustly
    const attrStr = row.additional_attributes?.trim();
    if (attrStr) {
      const brand = extractAttribute(attrStr, 'brand');
      if (brand) updateData.brand = brand;
      
      const gender = extractAttribute(attrStr, 'gender');
      if (gender) updateData.gender = gender;
        
        const shipCostStr = extractAttribute(attrStr, 'ship_cost');
        if (shipCostStr !== null) {
          updateData.isFreeShipping = shipCostStr === "0.000000" || shipCostStr === "0";
        }
      
      // Magento exports size chart as either 'size_chart' or 'size_chart_01'
      const sizeChart = extractAttribute(attrStr, 'size_chart') || extractAttribute(attrStr, 'size_chart_01');
      if (sizeChart) updateData.sizeChart = sizeChart;
    }

    // Images mapping
    const images = buildImages(row);
    if (images) {
      updateData.images = images;
    }

    // If we extracted something useful, add it to the batch
    if (Object.keys(updateData).length > 0) {
      batch.push({
        updateOne: {
          filter: { sku: sku },
          update: { $set: updateData },
          upsert: true
        }
      });
    } else {
      totalSkipped++; // SKU matched but nothing to update
    }

    // Process batch when it hits BATCH_SIZE
    if (batch.length === BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
      console.log(`Processed ${processedCount} rows...`);
    }
  }

  // Process remaining batch items
  if (batch.length > 0) {
    await processBatch(batch);
  }
  console.log(`Processed ${processedCount} rows... (Complete)`);

  console.log('\nMigration Completed!');
  console.log(`Total Updated: ${totalUpdated}`);
  console.log(`Total Not Found (SKU didn't match): ${totalNotFound}`);
  console.log(`Total Skipped: ${totalSkipped}`);

  console.log('\n--- Phase 2: Building variants[] from configurable_variations ---');
  await buildVariants(ProductModel);

  // Phase 3: Recover variants that missed the configurable mapping
  await recoverOrphanVariants(ProductModel);

  await mongoose.disconnect();
  console.log('Database disconnected.');

  async function processBatch(ops: any[]) {
    try {
      const result = await ProductModel.bulkWrite(ops, { ordered: false });
      totalUpdated += result.modifiedCount || 0;
      
      const matched = result.matchedCount || 0;
      totalNotFound += (ops.length - matched);
    } catch (error: any) {
      // With ordered:false, partial success is possible — count what succeeded
      if (error.result) {
        totalUpdated += error.result.modifiedCount || 0;
        const matched = error.result.matchedCount || 0;
        totalNotFound += (ops.length - matched - (error.result.upsertedCount || 0));
      }
      // Log just the error message, not the full stack
      const msg = error.writeErrors?.map((e: any) => e.errmsg || e.message).join(', ') || error.message;
      console.warn(`  Batch warning (${error.writeErrors?.length || 1} errors): ${msg.substring(0, 200)}`);
    }
  }
}

/**
 * Phase 2: Build variants[] array for configurable products.
 * 
 * Parses the configurableVariations string from parent products,
 * looks up each child variant SKU in DB for its actual price & stock,
 * then writes the complete variants[] array back to the parent.
 */
async function buildVariants(ProductModel: any) {
  const configurableProducts = await ProductModel.find({
    productType: 'configurable',
    configurableVariations: { $exists: true, $ne: '' }
  }).select('_id sku configurableVariations').lean().exec();

  console.log(`Found ${configurableProducts.length} configurable products to process.`);

  let variantsBuilt = 0;
  let variantsFailed = 0;
  const variantBatch: any[] = [];

  for (const parent of configurableProducts) {
    try {
      // Parse: "sku=ABC-7,color=Black,eu_size=41|sku=ABC-8,color=Red,eu_size=42"
      const variantDefs = (parent.configurableVariations as string).split('|').filter(Boolean);
      const variants: any[] = [];

      // Collect all child SKUs first for a single batch query
      const childSkus: string[] = [];
      const variantAttrMap: Record<string, Record<string, string>> = {};

      for (const def of variantDefs) {
        const pairs = def.split(',');
        const attrs: Record<string, string> = {};
        let variantSku = '';

        for (const pair of pairs) {
          const eqIdx = pair.indexOf('=');
          if (eqIdx === -1) continue;
          const key = pair.substring(0, eqIdx).trim();
          const val = pair.substring(eqIdx + 1).trim();
          if (key === 'sku') {
            variantSku = val;
          } else {
            // Normalize common attribute names
            const normalizedKey = key
              .replace(/^eu_size.*/, 'size')
              .replace(/^shoe_size.*/, 'size')
              .replace(/^helmet_size.*/, 'size')
              .replace(/^glove_size.*/, 'size')
              .replace(/^jacket_size.*/, 'size')
              .replace(/^pant_size.*/, 'size')
              .replace(/^boot_size.*/, 'size');
            attrs[normalizedKey] = val;
          }
        }

        if (variantSku) {
          childSkus.push(variantSku);
          variantAttrMap[variantSku] = attrs;
        }
      }

      if (childSkus.length === 0) continue;

      // Batch lookup all child SKUs at once
      const childProducts = await ProductModel.find({
        sku: { $in: childSkus }
      }).select('sku basePrice specialPrice qty stockStatus').lean().exec();

      const childMap = new Map<string, any>();
      for (const child of childProducts) {
        childMap.set(child.sku, child);
      }

      for (const childSku of childSkus) {
        const child = childMap.get(childSku);
        const attrs = variantAttrMap[childSku] || {};

        variants.push({
          id: childSku,
          sku: childSku,
          price: child?.basePrice || child?.specialPrice || 0,
          specialPrice: child?.specialPrice || undefined,
          stock: child?.qty || (child?.stockStatus === 1 ? 999 : 0),
          attributes: attrs
        });
      }

      if (variants.length > 0) {
        // Fix ₹0 price: Set parent's basePrice from first variant that has a real price
        const firstPricedVariant = variants.find((v: any) => v.price > 0);
        const updateFields: any = { variants: variants };
        
        if (firstPricedVariant) {
          // Find the lowest price across all variants for display
          const lowestPrice = Math.min(...variants.filter((v: any) => v.price > 0).map((v: any) => v.price));
          const lowestSpecial = variants
            .filter((v: any) => v.specialPrice && v.specialPrice > 0)
            .map((v: any) => v.specialPrice);
          
          updateFields.basePrice = lowestPrice;
          if (lowestSpecial.length > 0) {
            updateFields.specialPrice = Math.min(...lowestSpecial);
          }
        }
        
        variantBatch.push({
          updateOne: {
            filter: { _id: parent._id },
            update: { $set: updateFields }
          }
        });
        variantsBuilt++;
      }

      // Flush batch every 50
      if (variantBatch.length >= 50) {
        await ProductModel.bulkWrite(variantBatch);
        console.log(`  Variants built for ${variantsBuilt} products...`);
        variantBatch.length = 0;
      }
    } catch (err: any) {
      variantsFailed++;
      console.error(`  Error building variants for ${parent.sku}:`, err.message);
    }
  }

  // Flush remaining
  if (variantBatch.length > 0) {
    await ProductModel.bulkWrite(variantBatch);
  }

  console.log(`Phase 2 Complete! Variants built: ${variantsBuilt}, Failed: ${variantsFailed}`);
}

/**
 * Phase 3: Orphan Variant Recovery
 * Finds products with basePrice = 0 and no variants (because configurable_variations was missing/empty in CSV)
 * and scans the DB for children using SKU prefix matching to attach them.
 */
async function recoverOrphanVariants(ProductModel: any) {
  console.log('\n--- Starting Phase 3: Orphan Variant Recovery ---');
  
  // Find products that have 0 price and no variants
  const orphans = await ProductModel.find({
    $or: [{ basePrice: 0 }, { basePrice: { $exists: false } }],
    $or: [{ variants: { $size: 0 } }, { variants: { $exists: false } }]
  }).select('_id sku name').lean().exec();

  console.log(`Found ${orphans.length} potential orphaned parents with ₹0 price.`);

  let recoveredCount = 0;
  const batch: any[] = [];

  for (const parent of orphans) {
    if (!parent.sku) continue;

    // Search for child products using sku prefix (e.g., RYNOX-H2GO-S matches ^RYNOX-H2GO-)
    const children = await ProductModel.find({
      sku: { $regex: new RegExp(`^${parent.sku}[-_]`, 'i') },
      status: 'draft',
      basePrice: { $gt: 0 }
    }).lean().exec();

    if (children && children.length > 0) {
      const variants = children.map((c: any) => {
        let size = "Standard";
        const nameParts = c.name.split("-");
        if (nameParts.length > 1) {
           const potentialSize = nameParts[nameParts.length - 2].trim();
           if (["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"].includes(potentialSize)) {
              size = potentialSize;
           }
        }
        return {
          sku: c.sku,
          price: c.basePrice,
          specialPrice: c.specialPrice,
          stock: c.qty || 10,
          attributes: { size }
        };
      });

      const lowestPrice = Math.min(...variants.filter((v: any) => v.price > 0).map((v: any) => v.price));
      const lowestSpecial = variants
        .filter((v: any) => v.specialPrice && v.specialPrice > 0)
        .map((v: any) => v.specialPrice);

      const updateFields: any = { variants: variants, basePrice: lowestPrice };
      if (lowestSpecial.length > 0) {
        updateFields.specialPrice = Math.min(...lowestSpecial);
      }

      batch.push({
        updateOne: {
          filter: { _id: parent._id },
          update: { $set: updateFields }
        }
      });
      recoveredCount++;
    }
  }

  if (batch.length > 0) {
    await ProductModel.bulkWrite(batch);
  }

  console.log(`Phase 3 Complete! Recovered ${recoveredCount} orphaned products with their variants/prices.`);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
