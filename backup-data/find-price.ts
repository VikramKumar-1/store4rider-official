import fs from 'fs';
const code = fs.readFileSync('frontend/src/modules/product-detail/components/ProductInfo.tsx', 'utf8');
const lines = code.split('\n');
const priceIdx = lines.findIndex(l => l.includes('/* Pricing (Side by Side) */'));
console.log(lines.slice(priceIdx, priceIdx + 30).join('\n'));
