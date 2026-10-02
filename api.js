const fs = require('fs');
async function run() {
  const r = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&titles=File:RuPay_logo.svg&format=json');
  const j = await r.json();
  console.log(JSON.stringify(j));
}
run();
