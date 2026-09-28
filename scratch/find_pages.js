const fs = require('fs');
const path = require('path');

function searchFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(searchFiles(file));
    } else if (file.endsWith('page.tsx')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('Orders') || content.includes('Order')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = searchFiles('frontend/app');
fs.writeFileSync('scratch/pages.txt', files.join('\n'));
