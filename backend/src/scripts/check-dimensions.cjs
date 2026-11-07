const sharp = require('sharp');
const fs = require('fs');
const https = require('https');

async function test() {
  const hashes = [
    '198786be67cd038c1a2a4b042853a112',
    'aee624646c6861b3bc48f4d4e1b8cfb7',
    'baf00c363d8e8bde21d76abb4a867f6f',
    'c9c7d3d7278be7d932107f82016188c1',
    'ca81863f8e838aca1592d58dbe0aa64f',
    'd875ecafc3bbab4a340e55ce0ea1b885',
  ];
  for (const h of hashes) {
    const p = `backup-data/extracted_media/cache/${h}/b/o/bobo-bm4-pro-jaw-grip-bike-phone-holder-with-vibration-controller-motorcycle-mobile-mount-_1_.jpg`;
    if (fs.existsSync(p)) {
      const meta = await sharp(p).metadata();
      const sz = fs.statSync(p).size;
      console.log(`Cache hash ${h}: ${meta.width}x${meta.height}, ${sz} bytes`);
    }
  }

  // Also check original if exists in extracted_media or backup-data
  console.log('\nChecking if original un-cached file exists:');
  function findOriginal(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = `${dir}/${ent.name}`;
      if (ent.isDirectory() && ent.name !== 'cache') {
        findOriginal(full);
      } else if (ent.isFile() && ent.name.includes('bobo-bm4-pro-jaw-grip-bike-phone-holder-with-vibration-controller-motorcycle-mobile-mount-_1_')) {
        console.log('Original found at:', full);
      }
    }
  }
  findOriginal('backup-data');
}
test().catch(console.error);
