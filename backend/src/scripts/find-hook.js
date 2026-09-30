const fs = require('fs');
const path = require('path');
function search(dir, keyword) {
  let results = [];
  const files = fs.readdirSync(dir);
  for(const f of files) {
    const fullPath = path.join(dir, f);
    if(fs.statSync(fullPath).isDirectory()) {
      results = results.concat(search(fullPath, keyword));
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(keyword)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}
const matches = search('c:/Users/vikur/Downloads/store4riders/frontend/src/core/hooks', 'useProduct');
matches.forEach(m => console.log(m));
