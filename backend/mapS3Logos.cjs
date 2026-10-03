const fs = require('fs');
const navFile = 'frontend/src/modules/homepage/components/navbar/nav.constants.ts';
let code = fs.readFileSync(navFile, 'utf8');

const s3Base = "https://s3.ap-south-2.amazonaws.com/store4riders/";

const mappings = [
  { label: 'Axor', key: 'brand-logos/axor-logo_bw_100x51.png' },
  { label: 'Rynox', key: 'brand-logos/Rynox-Logo.png' },
  { label: 'Sena', key: 'brand-logos/SENA-LOGO.png' },
  { label: 'Viaterra', key: 'brand-logos/VIATERRA_LOGO_PNG.png' },
  { label: 'Parani', key: 'brand-logos/PARANI-LOGO.png' },
  { label: 'Bobo', key: 'brand-logos/BOBO-Logo-Blue-Black.png' },
  // Let's assume others might exist or leave them as is
];

mappings.forEach(m => {
  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedLabel = escapeRegExp(m.label);
  
  const regex = new RegExp(`({\\s*label:\\s*["']${escapedLabel}["']\\s*,[^}]+logoUrl:\\s*)["'][^"']+["']`, 'ig');
  code = code.replace(regex, `$1"${s3Base}${m.key}"`);
});

fs.writeFileSync(navFile, code);
console.log("Updated available logos in nav.constants.ts");
