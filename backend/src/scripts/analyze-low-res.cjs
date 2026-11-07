const fs = require('fs');
const list = JSON.parse(fs.readFileSync('low-res-images.json'));
const prodMap = new Map();
for (const item of list) {
  for (const p of item.products) {
    if (!prodMap.has(p.sku)) {
      prodMap.set(p.sku, { name: p.name, count: 0, images: [] });
    }
    prodMap.get(p.sku).count++;
    prodMap.get(p.sku).images.push({ key: item.key, width: item.width, height: item.height });
  }
}
console.log('Total unique products affected by low-res images:', prodMap.size);
for (const [sku, data] of prodMap.entries()) {
  const widths = data.images.map(x => x.width);
  console.log(`- [SKU: ${sku}] "${data.name}" (${data.count} images, width: ${Math.min(...widths)}px - ${Math.max(...widths)}px)`);
}
