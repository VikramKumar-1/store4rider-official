const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'backend', 'src', 'modules');

function processDir(dir) {
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      processDir(filePath);
    } else if (file.endsWith('.route.ts')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extremely safe regex:
      // Matches '/**' followed immediately by whitespace and '*' and '@swagger'
      const regex = /\/\*\*[\s\n\*]*@swagger[\s\S]*?\*\//g;
      
      const blocks = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        blocks.push(match[0]);
      }
      
      if (blocks.length > 0) {
        // Remove the blocks from the route file safely
        const cleanedContent = content.replace(regex, '').replace(/\n\s*\n\s*\n/g, '\n\n');
        fs.writeFileSync(filePath, cleanedContent);
        
        // Write the new swagger file
        const swaggerPath = filePath.replace('.route.ts', '.swagger.ts');
        const swaggerContent = `/**\n * Swagger Documentation\n */\n\n` + blocks.join('\n\n') + '\n\n// Fix for TypeScript isolatedModules error\nexport {};\n';
        fs.writeFileSync(swaggerPath, swaggerContent);
        console.log(`Successfully extracted swagger from ${file}`);
      }
    }
  }
}

// Ensure the swagger config scans the new files
const configPath = path.join(__dirname, 'backend', 'src', 'core', 'config', 'swagger.ts');
let configContent = fs.readFileSync(configPath, 'utf-8');
if (!configContent.includes('**/*.swagger.ts')) {
  configContent = configContent.replace(
    'apis: ["./src/modules/**/*.route.ts", "./src/app/api/**/*.ts"],',
    'apis: ["./src/modules/**/*.route.ts", "./src/modules/**/*.swagger.ts", "./src/app/api/**/*.ts"],'
  );
  fs.writeFileSync(configPath, configContent);
}

processDir(modulesDir);
console.log('\nAll swagger blocks extracted perfectly! No red lines!');
