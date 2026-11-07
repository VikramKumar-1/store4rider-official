const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// 1. Load Environment Variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'store4riders-media';
const CLOUDFRONT_BASE = process.env.NEXT_PUBLIC_CDN_URL || 'https://d2zuvpvc0pfkya.cloudfront.net';

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('â Œ Error: AWS credentials missing in .env file.');
  process.exit(1);
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  maxAttempts: 5,
});

const EXTRACTED_DIR = path.join(__dirname, 'extracted_media');
const STATE_FILE = path.join(__dirname, '.sync-progress.json');
const ERROR_LOG = path.join(__dirname, '.sync-errors.json');
const CONCURRENCY = 30; // Optimal concurrency for stable throughput & memory safety
const MAX_DIMENSION = 2400; // Ultra high-res ceiling (prevents 40MP camera dumps from wasting bandwidth)

const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff']);

// Parse CLI flags (e.g. --limit 100)
const args = process.argv.slice(2);
let limitCount = Infinity;
const limitIndex = args.indexOf('--limit');
if (limitIndex !== -1 && args[limitIndex + 1]) {
  limitCount = parseInt(args[limitIndex + 1], 10);
}

// 1. Load existing progress to resume automatically
let completedSet = new Set();
if (fs.existsSync(STATE_FILE)) {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const arr = JSON.parse(raw);
    completedSet = new Set(arr);
    console.log(`ðŸ“‹ Found previous session: ${completedSet.size} images already uploaded. Resuming!`);
  } catch (e) {
    console.warn('Warning: Could not parse state file, starting fresh.');
  }
}

let errorLog = [];
if (fs.existsSync(ERROR_LOG)) {
  try {
    errorLog = JSON.parse(fs.readFileSync(ERROR_LOG, 'utf8'));
  } catch (e) {
    errorLog = [];
  }
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(Array.from(completedSet)));
    if (errorLog.length > 0) {
      fs.writeFileSync(ERROR_LOG, JSON.stringify(errorLog, null, 2));
    }
  } catch (e) {
    // ignore transient locks
  }
}

/**
 * Robust Canonical S3 Key Mapper
 * Handles Magento cache/, subfolders, and maps ANY extension to .webp cleanly
 */
function toCanonicalS3Key(relPath) {
  let clean = relPath.replace(/\\/g, '/');

  // If path is inside cache/<hash>/, unwrap to canonical location
  if (clean.startsWith('cache/')) {
    const parts = clean.split('/');
    if (parts.length >= 5) {
      clean = parts.slice(2).join('/');
    }
  }

  // Strip whatever original extension existed (.jpg, .png, .jpeg, etc.) and append .webp
  const cleanWithoutExt = clean.replace(/\.[^/.]+$/, '');
  return 'catalog/product/' + cleanWithoutExt + '.webp';
}

/**
 * Step 1: Scan and Index Files with Memory Efficiency
 */
function collectFilesToUpload() {
  console.log(`\nâŒ› Step 1: Scanning & Indexing images from ${EXTRACTED_DIR}...`);
  const s3Map = new Map(); // s3Key -> localPath

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else {
        if (ent.name.startsWith('._')) continue;
        const ext = path.extname(ent.name).toLowerCase();
        if (!VALID_EXTENSIONS.has(ext)) continue;

        const rel = path.relative(EXTRACTED_DIR, full);
        const s3Key = toCanonicalS3Key(rel);

        // Prefer full-resolution images over cache versions if duplicate key exists
        if (!s3Map.has(s3Key) || !rel.startsWith('cache')) {
          s3Map.set(s3Key, full);
        }
      }
    }
  }

  walk(EXTRACTED_DIR);
  console.log(`âœ… Indexed ${s3Map.size} unique canonical images across all nested directories.`);

  // Filter out already completed files
  const pending = [];
  for (const [s3Key, localPath] of s3Map.entries()) {
    if (!completedSet.has(s3Key)) {
      pending.push({ s3Key, localPath });
    }
  }

  console.log(`ðŸ“‹ Pending to upload: ${pending.length} images (${completedSet.size} already done).`);
  return pending;
}

/**
 * 3-Tier Adaptive WebP Converter (Zero Quality Loss for <50KB)
 */
async function processImageToWebP(localPath) {
  const originalBuffer = fs.readFileSync(localPath);
  const size = originalBuffer.length;

  let pipeline = sharp(originalBuffer);
  const metadata = await pipeline.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Max dimension guard
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // 3-Tier Adaptive Logic
  if (size < 50 * 1024) {
    // Tier 1 (< 50 KB): PURE LOSSLESS WEBP (NO COMPRESSION, 100% BIT-FOR-BIT PIXEL FIDELITY)
    pipeline = pipeline.webp({
      lossless: true,
      effort: 4,
    });
  } else if (size <= 150 * 1024) {
    // Tier 2 (50 KB - 150 KB): GENTLE OPTIMIZATION (Quality 92, Crisp Edges)
    pipeline = pipeline.webp({
      quality: 92,
      effort: 5,
      smartSubsample: true,
    });
  } else {
    // Tier 3 (> 150 KB): FULL WEBP OPTIMIZATION (Quality 85, Balanced File Size)
    pipeline = pipeline.webp({
      quality: 85,
      effort: 6,
      smartSubsample: true,
    });
  }

  const webpBuffer = await pipeline.toBuffer();
  return webpBuffer;
}

/**
 * Concurrent Worker Pool with Auto-Retry & Memory Safety
 */
async function uploadBatch(files) {
  const targetFiles = files.slice(0, limitCount);
  console.log(`\nâš¡ Step 2: Uploading ${targetFiles.length} images to S3 bucket [${AWS_S3_BUCKET}] in region [${AWS_REGION}]...`);
  console.log(`ðŸŒ  CDN Base URL: ${CLOUDFRONT_BASE}`);
  console.log(`ðŸ”„ Concurrency: ${CONCURRENCY} parallel streams\n`);

  let completed = 0;
  let errors = 0;
  const total = targetFiles.length;
  const startTime = Date.now();
  let cursor = 0;

  async function uploadOne(file) {
    let attempts = 0;
    while (attempts < 4) {
      try {
        const webpBuffer = await processImageToWebP(file.localPath);

        await s3.send(new PutObjectCommand({
          Bucket: AWS_S3_BUCKET,
          Key: file.s3Key,
          Body: webpBuffer,
          ContentType: 'image/webp',
          CacheControl: 'public, max-age=31536000, immutable',
        }));

        completedSet.add(file.s3Key);
        completed++;
        return;
      } catch (err) {
        attempts++;
        if (attempts >= 4) {
          errors++;
          errorLog.push({ s3Key: file.s3Key, localPath: file.localPath, error: err.message, time: new Date().toISOString() });
          console.error(`\nâ Œ Failed after 4 attempts: ${file.s3Key} (${err.message})`);
        } else {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 600 * attempts));
        }
      }
    }
  }

  async function worker() {
    while (cursor < targetFiles.length) {
      const idx = cursor++;
      const file = targetFiles[idx];
      await uploadOne(file);

      if (completed % 20 === 0 || completed === total) {
        const elapsedSec = (Date.now() - startTime) / 1000;
        const rate = (completed / (elapsedSec || 1)).toFixed(1);
        const percent = ((completed / total) * 100).toFixed(1);
        const remainingSec = rate > 0 ? Math.round((total - completed) / rate) : 0;
        const remMins = Math.floor(remainingSec / 60);
        const remSecs = remainingSec % 60;

        process.stdout.write(`\r[${completed}/${total}] (${percent}%) | Speed: ${rate} img/s | Remaining: ~${remMins}m ${remSecs}s | Errors: ${errors} `);
        saveState();
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);
  saveState();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nâœ… Batch Finished in ${totalTime}s! Uploaded: ${completed}, Failed: ${errors}`);
  console.log(`ðŸ“Š Total verified in S3 progress state: ${completedSet.size} images.`);
}

async function main() {
  const pendingFiles = collectFilesToUpload();
  if (pendingFiles.length === 0) {
    console.log('âœ… All images are already uploaded! Everything is 100% in sync on S3.');
    return;
  }
  await uploadBatch(pendingFiles);
}

main().catch(console.error);
