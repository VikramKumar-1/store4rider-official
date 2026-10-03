const fs = require('fs');
const path = 'backend/src/modules/product/product.validator.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Fix size filter - find the size block and replace it
let startIdx = -1;
let endIdx = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const size = searchParams.get("size")')) {
    startIdx = i;
  }
  if (startIdx > -1 && i > startIdx + 2 && lines[i].trim() === '}') {
    endIdx = i;
    break;
  }
}

if (startIdx > -1 && endIdx > -1) {
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  const indent = '    ';
  const newBlock = [
    `${indent}const size = searchParams.get("size");`,
    `${indent}if (size) {`,
    `${indent}  const sizes = size.split(',').map(s => s.trim()).filter(Boolean);`,
    `${indent}  // Match "size=X" or "eu_size=X" inside configurableVariations`,
    `${indent}  const configVarRegexes = sizes.map(s => new RegExp(\`(?:size|eu_size)=\${ProductValidator.escapeRegExp(s)}(\\\\||,|$)\`, "i"));`,
    `${indent}  const exactRegexes = sizes.map(s => new RegExp(\`^\${ProductValidator.escapeRegExp(s)}$\`, "i"));`,
    `${indent}  andConditions.push({`,
    `${indent}    $or: [`,
    `${indent}      { configurableVariations: { $in: configVarRegexes } },`,
    `${indent}      { "variants.attributes.size": { $in: exactRegexes } },`,
    `${indent}      { "variants.attributes.eu_size": { $in: exactRegexes } }`,
    `${indent}    ],`,
    `${indent}  });`,
    `${indent}}`
  ];

  const newLines = [...lines.slice(0, startIdx), ...newBlock, ...lines.slice(endIdx + 1)];
  fs.writeFileSync(path, newLines.join('\n'));
  console.log(`Fixed size filter: replaced lines ${startIdx+1} to ${endIdx+1}`);
} else {
  console.log('Could not find size filter block');
}
