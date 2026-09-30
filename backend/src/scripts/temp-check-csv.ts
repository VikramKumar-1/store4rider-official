import fs from 'fs';
import readline from 'readline';

async function checkCsv() {
  const fileStream = fs.createReadStream('c:/Users/vikur/Downloads/All product export csv-17.9.26.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  
  let header: string[] = [];
  let isFirstLine = true;
  
  for await (const line of rl) {
    if (isFirstLine) {
      header = line.split(',');
      isFirstLine = false;
      continue;
    }
    
    if (line.toLowerCase().includes('rynox h2go')) {
      const parts = line.split(',');
      const sku = parts[0];
      // Find index of 'price', 'product_type', 'configurable_variations'
      const priceIdx = header.indexOf('price');
      const typeIdx = header.indexOf('product_type');
      const varsIdx = header.indexOf('configurable_variations');
      const onlineIdx = header.indexOf('product_online');
      
      console.log(`SKU: ${sku}`);
      console.log(`Type: ${typeIdx > -1 ? parts[typeIdx] : 'Unknown'}`);
      console.log(`Price: ${priceIdx > -1 ? parts[priceIdx] : 'Unknown'}`);
      console.log(`Online: ${onlineIdx > -1 ? parts[onlineIdx] : 'Unknown'}`);
      
      if (varsIdx > -1) {
        const varsStr = parts[varsIdx] || '';
        console.log(`Variations length: ${varsStr.length}`);
        if (varsStr.length > 0) {
          console.log(`Variations string snippet: ${varsStr.substring(0, 100)}...`);
        }
      }
      console.log('-------------------');
    }
  }
}

checkCsv().catch(console.error);
