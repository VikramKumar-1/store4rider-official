const fs = require('fs');
let c = fs.readFileSync('frontend/src/modules/catalog/components/SidebarFilters.tsx', 'utf8');
c = c.replace(/\\`/g, '`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('frontend/src/modules/catalog/components/SidebarFilters.tsx', c);
