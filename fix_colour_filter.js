const fs = require('fs');
const path = 'backend/src/modules/product/product.validator.ts';
let content = fs.readFileSync(path, 'utf8');

// Find and replace the colour filter block
const oldBlock = `    const colour = searchParams.get("colour") || searchParams.get("color");
    if (colour) {
      const colours = colour.split(',').map(c => c.trim()).filter(Boolean);
      const colourRegexes = colours.map(c => new RegExp(\`\\\\\\\\b\${ProductValidator.escapeRegExp(c)}\\\\\\\\b\`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: colourRegexes } },
          { "variants.sku": { $in: colourRegexes } },
          { name: { $in: colourRegexes } },
          { "variants.attributes.color": { $in: colours.map(c => new RegExp(\`^\${ProductValidator.escapeRegExp(c)}$\`, "i")) } },
          { "variants.attributes.colour": { $in: colours.map(c => new RegExp(\`^\${ProductValidator.escapeRegExp(c)}$\`, "i")) } }
        ],
      });
    }`;

const newBlock = `    const colour = searchParams.get("colour") || searchParams.get("color");
    if (colour) {
      const colours = colour.split(',').map(c => c.trim()).filter(Boolean);
      // Match "color=X" inside configurableVariations string precisely
      const configVarRegexes = colours.map(c => new RegExp(\`color=\${ProductValidator.escapeRegExp(c)}(\\\\||,|$)\`, "i"));
      // Match exact value in structured variants.attributes
      const exactRegexes = colours.map(c => new RegExp(\`^\${ProductValidator.escapeRegExp(c)}$\`, "i"));
      andConditions.push({
        $or: [
          { configurableVariations: { $in: configVarRegexes } },
          { "variants.attributes.color": { $in: exactRegexes } },
          { "variants.attributes.colour": { $in: exactRegexes } }
        ],
      });
    }`;

// Try to find the block with different line endings
let found = false;
for (const ending of ['\r\n', '\n']) {
  const oldNorm = oldBlock.replace(/\n/g, ending);
  if (content.includes(oldNorm)) {
    content = content.replace(oldNorm, newBlock.replace(/\n/g, ending));
    found = true;
    break;
  }
}

if (!found) {
  // Fallback: find by searching for the key lines
  console.log('Exact block not found. Trying line-by-line approach...');
  
  const lines = content.split('\n');
  let startIdx = -1;
  let endIdx = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const colour = searchParams.get("colour")')) {
      startIdx = i;
    }
    if (startIdx > -1 && i > startIdx && lines[i].trim() === '}' && lines[i-1] && lines[i-1].includes('});')) {
      endIdx = i;
      break;
    }
  }
  
  if (startIdx > -1 && endIdx > -1) {
    const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
    const replacement = newBlock.replace(/\n/g, lineEnding);
    const newLines = [...lines.slice(0, startIdx), ...replacement.split('\n'), ...lines.slice(endIdx + 1)];
    content = newLines.join('\n');
    found = true;
    console.log(`Replaced lines ${startIdx+1} to ${endIdx+1}`);
  }
}

if (found) {
  fs.writeFileSync(path, content);
  console.log('Successfully updated colour filter block!');
} else {
  console.log('ERROR: Could not find the colour filter block to replace');
  // Debug: print lines around the colour section
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const colour')) {
      console.log(`Line ${i+1}: ${lines[i]}`);
      for (let j = i; j < Math.min(i+20, lines.length); j++) {
        console.log(`  ${j+1}: ${JSON.stringify(lines[j])}`);
      }
      break;
    }
  }
}
