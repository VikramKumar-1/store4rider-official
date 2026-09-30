import fs from 'fs';
import path from 'path';

function findFiles(dir: string, keyword: string) {
  let results: string[] = [];
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return results;
  }
  
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, keyword));
    } else {
      if (file.toLowerCase().includes(keyword.toLowerCase())) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const baseDir = 'C:\\Users\\vikur\\Downloads\\product catalogue media-072026\\pub\\media\\wysiwyg';
console.log(`Scanning local folder: ${baseDir}`);
const matches = findFiles(baseDir, 'Rynox');

if (matches.length > 0) {
  console.log(`\nFound ${matches.length} Rynox images locally:`);
  matches.slice(0, 10).forEach(m => console.log(m.replace(baseDir, '')));
  if (matches.length > 10) console.log(`...and ${matches.length - 10} more`);
} else {
  console.log("No Rynox files found in the local wysiwyg folder.");
}
