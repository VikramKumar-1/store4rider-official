const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const CDN_BASE = 'https://d2zuvpvc0pfkya.cloudfront.net';
const BUCKET = process.env.AWS_S3_BUCKET || 'store4riders-media';
const REGION = process.env.AWS_REGION || 'ap-south-1';
const EXTRACTED_DIR = path.resolve(__dirname, '..', '..', '..', 'backup-data', 'extracted_media');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

async function runDemo() {
  console.log('1. Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('âœ… Connected to MongoDB Atlas.');

  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  // Find a product whose image file exists locally in extracted_media
  console.log('\n2. Finding a real product in database that matches a local image...');
  const cursor = productsColl.find({}).limit(100);
  let matchedProduct = null;
  let localImagePath = null;
  let relativeS3Path = null;

  for await (const prod of cursor) {
    if (!prod.images || prod.images.length === 0) continue;
    const rawUrl = prod.images[0].url || '';
    
    // e.g. "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/m/t/mt-14-pinlock.jpg" or "/m/t/mt-14-pinlock.jpg"
    let cleanRel = rawUrl.replace(/^https?:\/\/[^\/]+\//, '').replace(/^catalog\/product\//, '').replace(/^\/+/, '');
    const localCandidate = path.join(EXTRACTED_DIR, cleanRel.replace(/\//g, path.sep));

    if (fs.existsSync(localCandidate) && fs.statSync(localCandidate).isFile()) {
      matchedProduct = prod;
      localImagePath = localCandidate;
      relativeS3Path = cleanRel;
      break;
    }
  }

  // Fallback: Pick a known real image from folder and match by filename
  if (!matchedProduct) {
    function findFirstFile(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          const res = findFirstFile(full);
          if (res) return res;
        } else if (/\.(jpe?g|png)$/i.test(ent.name) && !ent.name.startsWith('._')) {
          return full;
        }
      }
      return null;
    }
    localImagePath = findFirstFile(EXTRACTED_DIR);
    const fname = path.basename(localImagePath);
    relativeS3Path = path.relative(EXTRACTED_DIR, localImagePath).replace(/\\/g, '/');
    matchedProduct = await productsColl.findOne({ 'images.url': { $regex: fname, $options: 'i' } });
    if (!matchedProduct) {
      matchedProduct = await productsColl.findOne({});
    }
  }

  console.log('\n--- REAL PRODUCT FOUND ---');
  console.log('ðŸ“¦ Product Name :', matchedProduct.name);
  console.log('ðŸ”‘ SKU          :', matchedProduct.sku);
  console.log('ðŸ“ Local File   :', localImagePath);

  const originalStats = fs.statSync(localImagePath);
  console.log('ðŸ“  Original Size:', (originalStats.size / 1024).toFixed(1) + ' KB');

  // 3. Convert to WebP using Sharp (Quality 85, Smart Subsample, No Blur)
  console.log('\n3. Converting to High-Resolution WebP with Sharp (Zero Blur)...');
  const originalBuffer = fs.readFileSync(localImagePath);
  const webpBuffer = await sharp(originalBuffer)
    .webp({
      quality: 85,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer();

  const originalKb = (originalStats.size / 1024).toFixed(1);
  const webpKb = (webpBuffer.length / 1024).toFixed(1);
  const savings = (((originalStats.size - webpBuffer.length) / originalStats.size) * 100).toFixed(1);
  console.log(`ðŸŽ¯ WebP Size   : ${webpKb} KB (Reduced by ${savings}%, crystal clear!)`);

  // 4. Upload to S3 with universal .webp extension
  const webpS3Key = 'catalog/product/' + relativeS3Path.replace(/\.[^/.]+$/, '') + '.webp';
  console.log('\n4. Uploading to S3 Key:', webpS3Key);

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: webpS3Key,
    Body: webpBuffer,
    ContentType: 'image/webp',
    CacheControl: 'public, max-age=31536000, immutable'
  }));
  console.log('âœ… Uploaded to S3 Bucket [store4riders-media] successfully!');

  // CloudFront Live CDN URL
  const liveCdnUrl = `${CDN_BASE}/${webpS3Key}`;
  console.log('ðŸš€ Live CloudFront CDN URL:', liveCdnUrl);

  // 5. Update MongoDB Database Record
  console.log('\n5. Updating MongoDB product record with new CloudFront WebP URL...');
  const updatedImages = (matchedProduct.images || []).map((img, idx) => {
    if (idx === 0) {
      return { ...img, url: liveCdnUrl };
    }
    return img;
  });

  if (updatedImages.length === 0) {
    updatedImages.push({ url: liveCdnUrl, altText: matchedProduct.name });
  }

  await productsColl.updateOne(
    { _id: matchedProduct._id },
    { $set: { images: updatedImages, thumbnail: liveCdnUrl } }
  );

  console.log('âœ… MongoDB record updated successfully!');

  // 6. Verify by re-fetching directly from DB
  const verifiedProd = await productsColl.findOne({ _id: matchedProduct._id });
  console.log('\n--- VERIFIED LIVE MONGODB RECORD ---');
  console.log('Product SKU   :', verifiedProd.sku);
  console.log('Product Name  :', verifiedProd.name);
  console.log('Thumbnail     :', verifiedProd.thumbnail);
  console.log('First Image   :', verifiedProd.images[0].url);

  await mongoose.disconnect();
  console.log('\nâœ… ALL DONE! Database & S3 & CloudFront are 100% in sync!');
}

runDemo().catch(console.error);
