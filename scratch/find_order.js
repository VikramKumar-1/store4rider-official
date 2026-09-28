const fs = require('fs');
const path = require('path');

function findFiles(dir, match) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, match);
    } else if (file.toLowerCase().includes(match)) {
      console.log(fullPath);
    }
  }
}

findFiles('frontend/src/modules/admin', 'order');
