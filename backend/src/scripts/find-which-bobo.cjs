const fs = require('fs');
const sharp = require('sharp');

async function findWhichImage() {
  const dir = 'backup-data/extracted_media/cache/ca81863f8e838aca1592d58dbe0aa64f/b/o';
  const files = fs.readdirSync(dir).filter(f => f.includes('bobo-bm4'));
  for (const f of files) {
    const p = dir + '/' + f;
    const meta = await sharp(p).metadata();
    // Crop bottom right corner: 100x100 from right: 0, bottom: 0
    const corner = await sharp(p)
      .extract({ left: meta.width - 120, top: meta.height - 60, width: 120, height: 60 })
      .toBuffer();
    // Check average brightness of corner: if dark, it has black BM4 PRO box
    const stats = await sharp(corner).stats();
    const isDark = stats.channels[0].mean < 100;
    console.log(f, isDark ? 'HAS BM4 PRO box (dark corner)' : 'NO BM4 PRO box (light corner)');
  }
}
findWhichImage();
