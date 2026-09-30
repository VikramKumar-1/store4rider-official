import fs from 'fs';
import readline from 'readline';

async function checkCsvDesc() {
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
      const descIdx = header.indexOf('description');
      
      if (descIdx > -1) {
        const desc = parts[descIdx] || '';
        if (desc.includes('<img')) {
          console.log(`Found description with images. Length: ${desc.length}`);
          console.log(desc.substring(0, 1000));
          break;
        }
      }
    }
  }
}

checkCsvDesc().catch(console.error);
