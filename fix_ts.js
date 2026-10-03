const fs = require('fs');
const path = 'backend/src/modules/product/product.service.ts';
let content = fs.readFileSync(path, 'utf8');

// Fix TS types
content = content.replace(
  'const variantObj = {};',
  'const variantObj: Record<string, string> = {};'
);

content = content.replace(
  'matchSize = rawActiveFilters.size.some(s => s.toLowerCase() === vSize.toLowerCase());',
  'matchSize = rawActiveFilters.size.some((s: string) => s.toLowerCase() === vSize.toLowerCase());'
);

content = content.replace(
  'matchColor = rawActiveFilters.colour.some(c => c.toLowerCase() === vColor.toLowerCase());',
  'matchColor = rawActiveFilters.colour.some((c: string) => c.toLowerCase() === vColor.toLowerCase());'
);

fs.writeFileSync(path, content);
console.log('TS errors fixed in product.service.ts');
