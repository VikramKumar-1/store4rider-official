const fs = require('fs');
const path = require('path');

function findSidebar(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findSidebar(fullPath);
    } else if (file.toLowerCase().includes('sidebar') || file === 'layout.tsx') {
      console.log(fullPath);
    }
  }
}

findSidebar('frontend/app/admin');
findSidebar('frontend/src/modules/admin');
