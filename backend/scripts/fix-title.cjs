const fs = require('fs');
const file = 'c:/Users/vikur/Downloads/store4riders/frontend/src/modules/catalog/index.tsx';
let content = fs.readFileSync(file, 'utf-8');

const target = `  const pageTitle = categoryParam \n    ? categoryParam.replace(/-/g, " ").toUpperCase() \n    : "ALL PRODUCTS";`;

const replacement = `  let brandParam = searchParams.get("brand") || "";
  if (!brandParam && params?.brandSlug) {
    const slugArr = Array.isArray(params.brandSlug) ? params.brandSlug : [params.brandSlug];
    brandParam = slugArr[slugArr.length - 1];
  }
  
  let pageTitle = "ALL PRODUCTS";
  if (categoryParam) {
    pageTitle = categoryParam.replace(/-/g, " ").toUpperCase();
  } else if (brandParam) {
    pageTitle = brandParam.replace(/-/g, " ").toUpperCase();
  }`;

// Use regex to replace to avoid whitespace issues
content = content.replace(/const pageTitle = categoryParam[\s\S]*?"ALL PRODUCTS";/, replacement);

fs.writeFileSync(file, content, 'utf-8');
console.log("Fixed undefined brandParam");
