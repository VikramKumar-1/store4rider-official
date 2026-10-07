const fs = require('fs');
const path = require('path');

function searchFiles(dir, term) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchFiles(fullPath, term);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(term)) {
        console.log(`Found in: ${fullPath}`);
      }
    }
  }
}

searchFiles('c:/Users/vikur/Downloads/store4riders/frontend/app', 'Navbar');
searchFiles('c:/Users/vikur/Downloads/store4riders/frontend/src/app', 'Navbar');
