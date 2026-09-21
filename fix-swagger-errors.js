const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'backend', 'src', 'modules');

function fixSwaggerFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fixSwaggerFiles(filePath);
    } else if (file.endsWith('.swagger.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // If the file doesn't already export something, add an empty export
      if (!content.includes('export')) {
        content += '\n// Fix for TypeScript isolatedModules error\nexport {};\n';
        fs.writeFileSync(filePath, content);
        console.log(`Fixed red lines in ${file}`);
      }
    }
  }
}

fixSwaggerFiles(modulesDir);
console.log('\nAll red lines fixed! You can safely delete this script now.');
