const fs = require('fs');
const https = require('https');
const path = require('path');

const logos = {
  "agv.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/AGV_logo.svg/512px-AGV_logo.svg.png",
  "hjc.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/HJC_Helmets_logo.svg/512px-HJC_Helmets_logo.svg.png",
  "alpinestars.png": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Alpinestars_logo.svg/512px-Alpinestars_logo.svg.png",
  "bluarmor.png": "https://cdn.shopify.com/s/files/1/0255/1336/1474/files/bluarmor-logo_200x.png",
};

// NextJS cannot handle standard SVG files gracefully via next/image in some older versions without proper config, 
// so I'm converting the SVG links to standard base64 data URIs or downloading them if they are PNGs.
// Actually, let's just create clean text-based SVGs for the remaining ones locally, 
// because those external SVGs might 404 or be blocked.

const generateSimpleTextSvg = (text) => {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
        <text x="50%" y="50%" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="#0f172a" text-anchor="middle" dy=".35em">${text}</text>
    </svg>`;
};

fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/ls2.svg'), generateSimpleTextSvg("LS2"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/mt.svg'), generateSimpleTextSvg("MT Helmets"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/smk.svg'), generateSimpleTextSvg("SMK"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/shima.svg'), generateSimpleTextSvg("SHIMA"));
fs.writeFileSync(path.join(__dirname, 'frontend/public/brands/dsg.svg'), generateSimpleTextSvg("DSG"));


// Download PNGs
const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

async function run() {
  for (const [filename, url] of Object.entries(logos)) {
    const dest = path.join(__dirname, 'frontend/public/brands', filename);
    try {
        await download(url, dest);
        console.log(`Downloaded ${filename}`);
    } catch (e) {
        console.error(`Failed to download ${filename}:`, e);
    }
  }

  // Update nav.constants.ts
  const navFile = path.join(__dirname, 'frontend/src/modules/homepage/components/navbar/nav.constants.ts');
  let code = fs.readFileSync(navFile, 'utf8');

  code = code.replace(/logoUrl:\s*"https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/e\/e0\/AGV_logo\.svg\/512px-AGV_logo\.svg\.png"/, 'logoUrl: "/brands/agv.png"');
  code = code.replace(/logoUrl:\s*"https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/4\/4c\/HJC_Helmets_logo\.svg\/512px-HJC_Helmets_logo\.svg\.png"/, 'logoUrl: "/brands/hjc.png"');
  code = code.replace(/logoUrl:\s*"https:\/\/ls2helmets\.com\/images\/logo\.svg"/, 'logoUrl: "/brands/ls2.svg"');
  code = code.replace(/logoUrl:\s*"https:\/\/mthelmets\.com\/wp-content\/uploads\/2023\/02\/Logo-MT-Helmets-1\.svg"/, 'logoUrl: "/brands/mt.svg"');
  code = code.replace(/logoUrl:\s*"https:\/\/smkhelmets\.com\/wp-content\/uploads\/2020\/01\/logo\.png"/, 'logoUrl: "/brands/smk.svg"');
  code = code.replace(/logoUrl:\s*"https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/2\/23\/Alpinestars_logo\.svg\/512px-Alpinestars_logo\.svg\.png"/, 'logoUrl: "/brands/alpinestars.png"');
  code = code.replace(/logoUrl:\s*"https:\/\/shima\.pl\/img\/logo\.svg"/, 'logoUrl: "/brands/shima.svg"');
  code = code.replace(/logoUrl:\s*"https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/a\/a9\/DSG_logo\.svg\/512px-DSG_logo\.svg\.png"/, 'logoUrl: "/brands/dsg.svg"');
  code = code.replace(/logoUrl:\s*"https:\/\/cdn\.shopify\.com\/s\/files\/1\/0255\/1336\/1474\/files\/bluarmor-logo_200x\.png"/, 'logoUrl: "/brands/bluarmor.png"');

  fs.writeFileSync(navFile, code);
  console.log("Updated nav.constants.ts to use local images");
}

run();
