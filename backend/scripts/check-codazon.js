const fs = require('fs');
const code1 = fs.readFileSync('backend/src/modules/product/product.service.ts', 'utf8');
const code2 = fs.readFileSync('backend/src/modules/product/product.controller.ts', 'utf8');
console.log('service:', code1.includes('codazon'));
console.log('controller:', code2.includes('codazon'));
