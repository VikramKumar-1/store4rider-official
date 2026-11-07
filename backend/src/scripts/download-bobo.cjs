const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

async function downloadAndCompare() {
  const url = 'https://d2zuvpvc0pfkya.cloudfront.net/catalog/product/b/o/bobo-bm4-pro-jaw-grip-bike-phone-holder-with-vibration-controller-motorcycle-mobile-mount-_1_.webp';
  
  const buf = await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });

  fs.writeFileSync('cf-bobo.webp', buf);
  const meta = await sharp(buf).metadata();
  console.log('Downloaded cf-bobo.webp:');
  console.log('Size:', buf.length, 'bytes');
  console.log('Dimensions:', meta.width, 'x', meta.height);
  console.log('Format:', meta.format);

  // Check the local 544x544 jpg from cache ca81...
  const localJpg = 'backup-data/extracted_media/cache/ca81863f8e838aca1592d58dbe0aa64f/b/o/bobo-bm4-pro-jaw-grip-bike-phone-holder-with-vibration-controller-motorcycle-mobile-mount-_1_.jpg';
  if (fs.existsSync(localJpg)) {
    const localBuf = fs.readFileSync(localJpg);
    const localMeta = await sharp(localBuf).metadata();
    console.log('\nLocal 544x544 JPG:');
    console.log('Size:', localBuf.length, 'bytes');
    console.log('Dimensions:', localMeta.width, 'x', localMeta.height);
  }
}

downloadAndCompare().catch(console.error);
