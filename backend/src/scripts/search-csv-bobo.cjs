const fs = require('fs');
const readline = require('readline');

async function searchCsv() {
  const fileStream = fs.createReadStream('backup-data/csv_nov.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = null;
  for await (const line of rl) {
    if (!headers) {
      headers = line.split(',');
      continue;
    }
    if (line.includes('bobo-bm4-pro-jaw-grip')) {
      console.log('Found line in csv_nov.csv!');
      const parts = line.split(',');
      // Find columns for base_image, small_image, thumbnail, additional_images
      for (let i = 0; i < headers.length; i++) {
        const h = headers[i].replace(/"/g, '');
        if (h.includes('image') || h === 'sku' || h === 'name' || h === 'url_key') {
          console.log(`  ${h}: ${parts[i]}`);
        }
      }
      break;
    }
  }
}

searchCsv().catch(console.error);
