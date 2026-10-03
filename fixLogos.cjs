const fs = require('fs');
const path = require('path');

const generateSimpleTextSvg = (text) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
        <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#0f172a" text-anchor="middle" dy=".35em">${text}</text>
    </svg>`;
};

fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/agv.svg'), generateSimpleTextSvg("AGV"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/hjc.svg'), generateSimpleTextSvg("HJC"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/alpinestars.svg'), generateSimpleTextSvg("Alpinestars"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/bluarmor.svg'), generateSimpleTextSvg("BluArmor"));

// Also update nav.constants.ts
const navFile = path.join(__dirname, 'frontend/src/modules/homepage/components/navbar/nav.constants.ts');
let code = fs.readFileSync(navFile, 'utf8');

code = code.replace(/logoUrl:\s*["']\/brands\/agv\.(png|webp)["']/, 'logoUrl: "/brands/agv.svg"');
code = code.replace(/logoUrl:\s*["']\/brands\/hjc\.(png|webp)["']/, 'logoUrl: "/brands/hjc.svg"');
code = code.replace(/logoUrl:\s*["']\/brands\/alpinestars\.(png|webp)["']/, 'logoUrl: "/brands/alpinestars.svg"');
code = code.replace(/logoUrl:\s*["']\/brands\/bluarmor\.(png|webp)["']/, 'logoUrl: "/brands/bluarmor.svg"');

fs.writeFileSync(navFile, code);
console.log("Replaced corrupt images with clean typography SVGs");
