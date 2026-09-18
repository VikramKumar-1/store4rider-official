import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Inline MIME type mapping (no external dependency needed)
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// Load environment variables from the root .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-2';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || 'store4riders';

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('Error: AWS credentials not found in environment variables.');
  process.exit(1);
}

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const MEDIA_ROOT = 'C:\\Users\\vikur\\Downloads\\product catalogue media-072026\\pub\\media';
const MAX_CONCURRENCY = 10;
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MIN_FILE_SIZE = 500; // bytes

interface FileToUpload {
  localPath: string;
  s3Key: string;
}

let stats = {
  totalFound: 0,
  uploaded: 0,
  skipped: 0,
  errors: 0,
};

async function getFilesToUpload(): Promise<FileToUpload[]> {
  const files: FileToUpload[] = [];

  // 1. Product Images
  const productDir = path.join(MEDIA_ROOT, 'catalog', 'product');
  if (fs.existsSync(productDir)) {
    for await (const file of walkDir(productDir)) {
      if (isValidImage(file)) {
        files.push({
          localPath: file,
          s3Key: 'catalog/product/' + path.relative(productDir, file).replace(/\\/g, '/'),
        });
      }
    }
  }

  // 2. Category Images
  const categoryDir = path.join(MEDIA_ROOT, 'catalog', 'category');
  if (fs.existsSync(categoryDir)) {
    for await (const file of walkDir(categoryDir)) {
      if (isValidImage(file)) {
        files.push({
          localPath: file,
          s3Key: 'catalog/category/' + path.relative(categoryDir, file).replace(/\\/g, '/'),
        });
      }
    }
  }

  // 3. Brand Logos (only in root media folder)
  if (fs.existsSync(MEDIA_ROOT)) {
    const rootFiles = fs.readdirSync(MEDIA_ROOT);
    for (const file of rootFiles) {
      const fullPath = path.join(MEDIA_ROOT, file);
      if (fs.statSync(fullPath).isFile() && isValidImage(fullPath)) {
        files.push({
          localPath: fullPath,
          s3Key: 'brand-logos/' + file,
        });
      }
    }
  }

  return files;
}

async function* walkDir(dir: string): AsyncGenerator<string> {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* walkDir(res);
    } else {
      yield res;
    }
  }
}

function isValidImage(filePath: string): boolean {
  const fileName = path.basename(filePath);
  
  // Skip macOS hidden files
  if (fileName.startsWith('._')) {
    return false;
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return false;
  }

  const stat = fs.statSync(filePath);
  if (stat.size < MIN_FILE_SIZE) {
    return false;
  }

  return true;
}

async function checkS3ObjectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    }));
    return true; // Exists
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false; // Does not exist
    }
    throw error; // Other errors
  }
}

async function uploadFile(file: FileToUpload, currentIndex: number, totalFiles: number): Promise<void> {
  try {
    const exists = await checkS3ObjectExists(file.s3Key);
    if (exists) {
      stats.skipped++;
      console.log(`[${currentIndex}/${totalFiles}] ⏭️  Skipped (Already exists): ${file.s3Key}`);
      return;
    }

    const fileContent = fs.readFileSync(file.localPath);
    const contentType = getMimeType(file.localPath);

    await s3Client.send(new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: file.s3Key,
      Body: fileContent,
      ContentType: contentType,
    }));

    const sizeKb = (fs.statSync(file.localPath).size / 1024).toFixed(1);
    stats.uploaded++;
    console.log(`[${currentIndex}/${totalFiles}] ✅ Uploaded: ${file.s3Key} (${sizeKb} KB)`);
  } catch (error: any) {
    stats.errors++;
    console.error(`[${currentIndex}/${totalFiles}] ❌ Error uploading ${file.s3Key}: ${error.message}`);
  }
}

async function asyncPool(poolLimit: number, array: any[], iteratorFn: (item: any, index: number, total: number) => Promise<any>) {
  const ret = [];
  const executing = [];
  for (let i = 0; i < array.length; i++) {
    const p = Promise.resolve().then(() => iteratorFn(array[i], i + 1, array.length));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e: any = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function main() {
  console.log('Starting S3 Image Upload Script...');
  console.log(`Bucket: ${AWS_S3_BUCKET}`);
  console.log(`Region: ${AWS_REGION}`);

  console.log('\nScanning for files...');
  const files = await getFilesToUpload();
  stats.totalFound = files.length;
  console.log(`Found ${stats.totalFound} valid image files to process.\n`);

  await asyncPool(MAX_CONCURRENCY, files, uploadFile);

  console.log('\n--- Upload Summary ---');
  console.log(`Total Found: ${stats.totalFound}`);
  console.log(`Uploaded:    ${stats.uploaded}`);
  console.log(`Skipped:     ${stats.skipped}`);
  console.log(`Errors:      ${stats.errors}`);
  console.log('----------------------');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
