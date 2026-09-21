const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'backend', 'src', 'modules');

// Helper to find all .route.ts files recursively
function findRouteFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findRouteFiles(filePath, fileList);
    } else if (file.endsWith('.route.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const routeFiles = findRouteFiles(modulesDir);

let totalExtracted = 0;

for (const filePath of routeFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Match JSDoc blocks containing @swagger
  // Matches /** followed by anything (non-greedy) containing @swagger, ending with */
  const swaggerRegex = /\/\*\*[\s\S]*?@swagger[\s\S]*?\*\//g;
  
  const matches = content.match(swaggerRegex);
  
  if (matches && matches.length > 0) {
    // We found swagger comments!
    console.log(`Extracting ${matches.length} swagger blocks from ${path.basename(filePath)}`);
    
    // Create the .swagger.ts file content
    const moduleName = path.basename(filePath).replace('.route.ts', '');
    const swaggerContent = `/**\n * Swagger Documentation for ${moduleName.toUpperCase()} module\n */\n\n` + matches.join('\n\n') + '\n';
    
    const swaggerPath = filePath.replace('.route.ts', '.swagger.ts');
    fs.writeFileSync(swaggerPath, swaggerContent);
    
    // Remove the swagger blocks from the route file (leave a blank line)
    const cleanRouteContent = content.replace(swaggerRegex, '');
    
    // Clean up multiple blank lines that might be left behind
    const finalRouteContent = cleanRouteContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, finalRouteContent);
    totalExtracted += matches.length;
  }
}

// Now update the swagger config
const configPath = path.join(__dirname, 'backend', 'src', 'core', 'config', 'swagger.ts');
let configContent = fs.readFileSync(configPath, 'utf-8');
if (!configContent.includes('**/*.swagger.ts')) {
  configContent = configContent.replace(
    'apis: ["./src/modules/**/*.route.ts", "./src/app/api/**/*.ts"],',
    'apis: ["./src/modules/**/*.route.ts", "./src/modules/**/*.swagger.ts", "./src/app/api/**/*.ts"],'
  );
  fs.writeFileSync(configPath, configContent);
  console.log('Updated swagger.ts configuration!');
}

console.log(`\nSuccess! Extracted ${totalExtracted} swagger blocks across all modules.`);
