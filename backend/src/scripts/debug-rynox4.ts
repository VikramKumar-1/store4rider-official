import fs from 'fs';
import readline from 'readline';

async function checkCsvRaw() {
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
    
    if (line.includes('RH2GORJ')) {
      const parts = line.split(',');
      console.log('--- RAW CSV COLUMNS FOR RH2GORJ ---');
      for (let i = 0; i < header.length; i++) {
        const val = parts[i];
        if (val && val.trim() !== '' && val.trim() !== '""') {
          console.log(`${header[i]}: ${val}`);
        }
      }
      break;
    }
  }
}

checkCsvRaw().catch(console.error);
