const fs = require('fs');
const path = 'backend/src/modules/product/product.service.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /static async getAggregations\(filters: Record<string, unknown> = \{\}, categorySlug\?: string\): Promise<any> \{/,
  'static async getAggregations(filters: Record<string, unknown> = {}, categorySlug?: string, rawActiveFilters?: any): Promise<any> {'
);

const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('// 3. Extract Colors & Sizes from Magento Variations')) start = i;
  if (start > -1 && i > start && lines[i].includes('// 4. Extract dynamic attributes')) {
    end = i - 1;
    break;
  }
}

if (start > -1 && end > -1) {
  const newBlock = [
    '      // 3. Extract Colors & Sizes from Magento Variations (Smart Faceting)',
    '      if (p.configurableVariations) {',
    '        const variants = p.configurableVariations.split("|");',
    '        for (const variant of variants) {',
    '          const attrs = variant.split(",");',
    '          const variantObj = {};',
    '          for (const attr of attrs) {',
    '            const [key, value] = attr.split("=");',
    '            if (key && value) {',
    '              variantObj[key.trim().toLowerCase()] = value.trim();',
    '            }',
    '          }',
    '          ',
    '          const vColor = variantObj.color;',
    '          const vSize = variantObj.size || variantObj.eu_size;',
    '          ',
    '          // Facet: Only count this color if the variant matches the active size filter',
    '          let matchSize = true;',
    '          if (rawActiveFilters && rawActiveFilters.size && rawActiveFilters.size.length > 0 && vSize) {',
    '             matchSize = rawActiveFilters.size.some(s => s.toLowerCase() === vSize.toLowerCase());',
    '          }',
    '          if (matchSize && vColor) {',
    '             colorsMap.set(vColor, (colorsMap.get(vColor) || 0) + 1);',
    '          }',
    '          ',
    '          // Facet: Only count this size if the variant matches the active color filter',
    '          let matchColor = true;',
    '          if (rawActiveFilters && rawActiveFilters.colour && rawActiveFilters.colour.length > 0 && vColor) {',
    '             matchColor = rawActiveFilters.colour.some(c => c.toLowerCase() === vColor.toLowerCase());',
    '          }',
    '          if (matchColor && vSize) {',
    '             sizesMap.set(vSize, (sizesMap.get(vSize) || 0) + 1);',
    '          }',
    '        }',
    '      }'
  ].join('\n');

  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  const newLines = [...lines.slice(0, start), ...newBlock.split('\n'), '', ...lines.slice(end + 1)];
  fs.writeFileSync(path, newLines.join(lineEnding));
  console.log('Fixed aggregations!');
} else {
  console.log('Could not find block boundaries');
}
