const fs = require('fs');
const path = require('path');

function findEnvFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        findEnvFiles(filePath, fileList);
      }
    } else if (file.includes('.env')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const envFiles = findEnvFiles(__dirname);
console.log('Found .env files:');
console.log(envFiles.join('\n'));
