import fs from 'fs';
const code = fs.readFileSync('frontend/src/modules/product-detail/components/StickyFooterBar.tsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, i) => {
  if (line.includes('colors') && line.includes('map')) {
    console.log(`\n\n--- COLOR MAP AROUND LINE ${i+1} ---`);
    console.log(lines.slice(Math.max(0, i-5), i+20).join('\n'));
  }
  if (line.includes('sizes') && line.includes('map')) {
    console.log(`\n\n--- SIZE MAP AROUND LINE ${i+1} ---`);
    console.log(lines.slice(Math.max(0, i-5), i+20).join('\n'));
  }
});
