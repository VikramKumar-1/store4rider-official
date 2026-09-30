const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('c:\\Users\\vikur\\Downloads\\All product export csv-17.9.26.csv');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.toLowerCase().includes('clan scout')) {
      console.log("Found Clan Scout row.");
      const matches = line.match(/([a-zA-Z0-9_]*size[a-zA-Z0-9_]*)=/gi);
      console.log("Size-related attributes:", matches);
      break;
    }
  }
}
processLineByLine();
