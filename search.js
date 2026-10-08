const fs = require('fs');
const glob = require('glob'); // Not available? I'll use simple fs.
const files = fs.readdirSync('c:/Users/vikur/Downloads/store4riders/frontend/src/modules/catalog', { recursive: true });

files.forEach(f => {
  if (f.endsWith('.tsx')) {
    const content = fs.readFileSync(`c:/Users/vikur/Downloads/store4riders/frontend/src/modules/catalog/${f}`, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('min-h')) {
        console.log(`${f}:${i+1}: ${line.trim()}`);
      }
    });
  }
});
