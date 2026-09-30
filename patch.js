const fs = require('fs');
let f = fs.readFileSync('backend/src/scripts/sync-csv-to-db.ts', 'utf8');
f = f.replace(
  'if (gender) updateData.gender = gender;', 
  `if (gender) updateData.gender = gender;
        
        const shipCostStr = extractAttribute(attrStr, 'ship_cost');
        if (shipCostStr !== null) {
          updateData.isFreeShipping = shipCostStr === "0.000000" || shipCostStr === "0";
        }`
);
fs.writeFileSync('backend/src/scripts/sync-csv-to-db.ts', f);
console.log("Done");
