import fs from 'fs';
import Papa from 'papaparse';

async function run() {
  const fileContent = fs.readFileSync('c:/Users/vikur/Downloads/store4riders/backup-data/Clancsv1.csv', 'utf8');
  
  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data as any[];
      
      const parent = rows.find(r => r.sku === 'RH2GORJ');
      console.log('--- CHECKING IN Clancsv1.csv ---');
      if (parent) {
        console.log('\n--- PARENT FOUND ---');
        console.log(`Price: ${parent.price} | Special: ${parent.special_price}`);
      } else {
        console.log('\nParent (RH2GORJ) NOT FOUND in this CSV.');
      }
      
      const child = rows.find(r => r.sku === 'H2GO_PRO3_RAIN_JKT_BLK_S');
      if (child) {
        console.log('\n--- CHILD FOUND ---');
        console.log(`Found! Price: ${child.price} | Special: ${child.special_price}`);
      } else {
        console.log('\nChild (H2GO_PRO3_RAIN_JKT_BLK_S) NOT FOUND in this CSV either.');
      }
    }
  });
}

run().catch(console.error);
