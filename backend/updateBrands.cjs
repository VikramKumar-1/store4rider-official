const fs = require('fs');

const navFile = 'frontend/src/modules/homepage/components/navbar/nav.constants.ts';
let code = fs.readFileSync(navFile, 'utf8');

const s3Base = "https://s3.ap-south-2.amazonaws.com/store4riders/brand-logos/";

const newBrandsMenu = `{
    id: "shop-by-brand",
    label: "Shop By Brand",
    href: "/products",
    hasDropdown: true,
    megaMenuItems: [
      {
        group: "Helmet Brands",
        items: [
          { label: "AGV", href: "/products?brand=agv" },
          { label: "HJC", href: "/products?brand=hjc" },
          { label: "LS2", href: "/products?brand=ls2" },
          { label: "MT Helmets", href: "/products?brand=mt" },
          { label: "Axor", href: "/products?brand=axor", logoUrl: "${s3Base}axor-logo_bw_100x51.png" },
          { label: "Axxis", href: "/products?brand=axxis", logoUrl: "${s3Base}Axxis-Logo-2.png" },
          { label: "SMK", href: "/products?brand=smk" },
          { label: "Vemar", href: "/products?brand=vemar", logoUrl: "${s3Base}vemar-100x51.png" },
          { label: "Vega", href: "/products?brand=vega", logoUrl: "${s3Base}vega100x75.png" }
        ],
      },
      {
        group: "Riding Gear",
        items: [
          { label: "Alpinestars", href: "/products?brand=alpinestars" },
          { label: "Rynox", href: "/products?brand=rynox", logoUrl: "${s3Base}new-rynox-logo-black.png" },
          { label: "Shima", href: "/products?brand=shima" },
          { label: "Viaterra", href: "/products?brand=viaterra", logoUrl: "${s3Base}VIATERRA_LOGO_PNG.png" },
          { label: "DSG", href: "/products?brand=dsg" },
          { label: "Macna", href: "/products?brand=macna", logoUrl: "${s3Base}macna-100x51.png" },
          { label: "Furygan", href: "/products?brand=furygan", logoUrl: "${s3Base}furygan_logo.jpg" },
          { label: "Raida", href: "/products?brand=raida", logoUrl: "${s3Base}Raida.png" },
          { label: "Knox", href: "/products?brand=knox", logoUrl: "${s3Base}knox.png" }
        ],
      },
      {
        group: "Luggage & Accessories",
        items: [
          { label: "Sena", href: "/products?brand=sena", logoUrl: "${s3Base}SENA-LOGO.png" },
          { label: "Parani", href: "/products?brand=parani", logoUrl: "${s3Base}PARANI-LOGO.png" },
          { label: "Bobo", href: "/products?brand=bobo", logoUrl: "${s3Base}BOBO-Logo-Blue-Black.png" },
          { label: "BluArmor", href: "/products?brand=bluarmor" },
          { label: "Dirtsack", href: "/products?brand=dirtsack", logoUrl: "${s3Base}Dirtsack.png" },
          { label: "Shad", href: "/products?brand=shad", logoUrl: "${s3Base}SHAD-LOGO-PNG.png" },
          { label: "Maddog", href: "/products?brand=maddog", logoUrl: "${s3Base}maddog-logo-2.png" }
        ],
      },
      {
        group: "Parts & Tyres",
        items: [
          { label: "Apollo", href: "/products?brand=apollo", logoUrl: "${s3Base}APOLLO.png" },
          { label: "Michelin", href: "/products?brand=michelin", logoUrl: "${s3Base}MICHELIN.jpg" },
          { label: "Pirelli", href: "/products?brand=pirelli", logoUrl: "${s3Base}PIRELLI.jpg" },
          { label: "Motul", href: "/products?brand=motul", logoUrl: "${s3Base}Motul-logo.png" },
          { label: "K&N", href: "/products?brand=k&n", logoUrl: "${s3Base}K_N-Logo.png" },
          { label: "NGK", href: "/products?brand=ngk", logoUrl: "${s3Base}NGK.png" },
          { label: "BMC Air Filter", href: "/products?brand=bmc", logoUrl: "${s3Base}BMC_Air_filter_logo.png" }
        ],
      }
    ],
  }`;

// Use regex to replace the entire object { id: "shop-by-brand", ... }
const regex = /{\s*id:\s*["']shop-by-brand["'][\s\S]*?(?=\s*},\s*{\s*id:\s*["']gadgets["'])/;
code = code.replace(regex, newBrandsMenu);

fs.writeFileSync(navFile, code);
console.log("Updated nav.constants.ts with new brand layout");
