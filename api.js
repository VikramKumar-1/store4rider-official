const fs = require('fs');
async function run() {
  const r = await fetch('https://commons.wikimedia.org/w/api.php?action=query&list=allimages&aiprop=url&aiprefix=Visa_Inc&format=json');
  const j = await r.json();
  console.log(JSON.stringify(j));
}
run();
