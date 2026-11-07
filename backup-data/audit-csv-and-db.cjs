const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function runAudit() {
  console.log('=== STARTING COMPLETE AUDIT ===\n');

  // 1. Audit backup-data/csv_nov.csv
  const csvPath = path.join(__dirname, 'csv_nov.csv');
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = null;
  let skuIdx = -1;
  let baseImgIdx = -1;
  let smallImgIdx = -1;
  let thumbIdx = -1;
  let addImgIdx = -1;

  let rowCount = 0;
  const csvImages = new Set();
  const productsWithNoImages = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    rowCount++;
    if (rowCount === 1) {
      header = line.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
      skuIdx = header.indexOf('sku');
      baseImgIdx = header.indexOf('base_image');
      smallImgIdx = header.indexOf('small_image');
      thumbIdx = header.indexOf('thumbnail');
      addImgIdx = header.indexOf('additional_images');
      console.log('CSV Headers Found:', { skuIdx, baseImgIdx, smallImgIdx, thumbIdx, addImgIdx });
      continue;
    }

    // Quick regex to parse quoted CSV fields
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    // Or basic split if no complex commas
    const parts = line.split(',');
    const sku = parts[skuIdx] ? parts[skuIdx].replace(/["']/g, '').trim() : '';
    const baseImg = parts[baseImgIdx] ? parts[baseImgIdx].replace(/["']/g, '').trim() : '';
    const addImgs = parts[addImgIdx] ? parts[addImgIdx].replace(/["']/g, '').trim() : '';

    let hasAnyImg = false;
    if (baseImg && baseImg !== 'no_selection') {
      csvImages.add(baseImg.replace(/^\/+/, ''));
      hasAnyImg = true;
    }
    if (addImgs) {
      addImgs.split(',').forEach(img => {
        const clean = img.replace(/["']/g, '').trim().replace(/^\/+/, '');
        if (clean && clean !== 'no_selection') {
          csvImages.add(clean);
          hasAnyImg = true;
        }
      });
    }

    if (!hasAnyImg && sku) {
      productsWithNoImages.push(sku);
    }
  }

  console.log(`\nCSV Summary:`);
  console.log(`- Total Rows in CSV: ${rowCount - 1}`);
  console.log(`- Total Unique Images referenced in CSV: ${csvImages.size}`);
  console.log(`- Products in CSV with NO images: ${productsWithNoImages.length}`);
  if (productsWithNoImages.length > 0) {
    console.log(`  Sample SKUs with no images:`, productsWithNoImages.slice(0, 10));
  }

  // 2. Check sync progress file
  const progressPath = path.join(__dirname, '.sync-progress.json');
  if (fs.existsSync(progressPath)) {
    const uploaded = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    const uploadedKeys = Object.keys(uploaded);
    console.log(`\nS3 / CloudFront Upload Summary:`);
    console.log(`- Total Canonical Images Uploaded: ${uploadedKeys.length}`);

    // Check how many CSV images were uploaded
    let foundInUpload = 0;
    let missingInUpload = [];

    for (const img of csvImages) {
      // img could be "m/t/mt-14-pinlock.jpg"
      const baseClean = img.replace(/^catalog\/product\//, '').replace(/^\/+/, '');
      const withWebp = baseClean.replace(/\.(jpe?g|png|gif|bmp|tiff)$/i, '') + '.webp';
      const originalPath = baseClean;

      if (uploaded[originalPath] || uploaded[withWebp] || uploaded[`catalog/product/${originalPath}`] || uploaded[`catalog/product/${withWebp}`]) {
        foundInUpload++;
      } else {
        missingInUpload.push(img);
      }
    }

    console.log(`- CSV Images matched in S3 upload: ${foundInUpload} / ${csvImages.size} (${((foundInUpload / csvImages.size) * 100).toFixed(1)}%)`);
    if (missingInUpload.length > 0) {
      console.log(`- Images in CSV not found in extracted_media: ${missingInUpload.length}`);
      console.log(`  Sample missing images:`, missingInUpload.slice(0, 5));
    }
  }

  // 3. Connect to MongoDB Atlas and inspect the 21 products that were not updated
  console.log('\nConnecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const totalMongo = await productsColl.countDocuments();
  console.log(`- Total Products in MongoDB Atlas: ${totalMongo}`);

  // Find products where thumbnail does NOT start with cloudfront
  const notCdn = await productsColl.find({
    thumbnail: { $not: /^https:\/\/d2zuvpvc0pfkya\.cloudfront\.net/ }
  }).project({ sku: 1, name: 1, thumbnail: 1, images: 1 }).toArray();

  console.log(`- Products without CloudFront thumbnail in DB: ${notCdn.length}`);
  if (notCdn.length > 0) {
    console.log(`  Details of non-CloudFront products:`);
    notCdn.forEach(p => {
      console.log(`  * SKU: ${p.sku} | Name: "${p.name}" | Thumbnail: "${p.thumbnail}" | Images count: ${p.images?.length || 0}`);
    });
  }

  await mongoose.disconnect();
  console.log('\n=== AUDIT COMPLETE ===');
}

runAudit().catch(console.error);
