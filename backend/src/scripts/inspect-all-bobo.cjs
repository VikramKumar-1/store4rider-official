const fs = require('fs');
const sharp = require('sharp');

async function inspectAllBoboImages() {
  const dir = 'backup-data/extracted_media/cache/ca81863f8e838aca1592d58dbe0aa64f/b/o';
  const files = fs.readdirSync(dir).filter(f => f.includes('bobo-bm4'));
  console.log('All bobo-bm4 files in ca81:');
  for (const f of files) {
    const meta = await sharp(dir + '/' + f).metadata();
    console.log(` - ${f}: ${meta.width}x${meta.height}, ${fs.statSync(dir + '/' + f).size} bytes`);
  }
}
inspectAllBoboImages();
