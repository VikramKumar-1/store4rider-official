import fs from 'fs';
import Papa from 'papaparse';

async function run() {
  const fileContent = fs.readFileSync('c:/Users/vikur/Downloads/All product export csv-17.9.26.csv', 'utf8');
  
  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data as any[];
      
      const parent = rows.find(r => r.sku === 'RH2GORJ');
      if (parent) {
        console.log('--- CORRECT PARSED PARENT ---');
        console.log(`Price: ${parent.price} | Special: ${parent.special_price}`);
        console.log(`Add. Attrs: ${parent.additional_attributes ? parent.additional_attributes.substring(0, 100) : 'none'}`);
      }
      
      const child = rows.find(r => r.sku === 'H2GO_PRO3_RAIN_JKT_BLK_S');
      console.log('\n--- CORRECT PARSED CHILD ---');
      if (child) {
        console.log(`Found! Price: ${child.price} | Special: ${child.special_price}`);
      } else {
        console.log('CHILD NOT FOUND IN CSV AT ALL!');
      }
    }
  });
}

run().catch(console.error);
