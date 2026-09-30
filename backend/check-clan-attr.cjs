const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('c:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers = [];
  let lineCount = 0;

  for await (const line of rl) {
    if (lineCount === 0) {
      headers = line.split(',');
      lineCount++;
      continue;
    }
    
    if (line.toLowerCase().includes('clan scout waterproof')) {
      const parts = line.split(',');
      const addtlAttrIndex = headers.indexOf('additional_attributes');
      if (addtlAttrIndex !== -1) {
        // Simple extraction just to peek
        const attrs = line.substring(line.indexOf('additional_attributes') > 0 ? line.indexOf('additional_attributes') : 0);
        console.log("Found Clan Scout row.");
        // Try to match anything with size_chart or size
        const matches = line.match(/([a-zA-Z0-9_]*size[a-zA-Z0-9_]*)=/gi);
        console.log("Size-related attributes:", matches);
      }
      break;
    }
    lineCount++;
  }
}
processLineByLine();
