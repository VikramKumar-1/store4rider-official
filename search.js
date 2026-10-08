const fs = require('fs');
const path = require('path');

function searchFiles(dir, keyword) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      searchFiles(filePath, keyword);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        console.log(`Found in: ${filePath}`);
      }
    }
  }
}

searchFiles(__dirname + '/backend/src', 'serpapi');
searchFiles(__dirname + '/frontend/src', 'serpapi');
searchFiles(__dirname + '/frontend/app', 'serpapi');
