import fs from 'fs';
import path from 'path';

function search(dir, keyword) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      search(fullPath, keyword);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(keyword)) {
        console.log(fullPath);
      }
    }
  }
}
search('frontend/src/components', 'swatch');
search('frontend/src/modules', 'swatch');
