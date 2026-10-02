const fs = require('fs');
async function dl(url, name) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if(r.ok) {
      const arr = await r.arrayBuffer();
      let text = Buffer.from(arr).toString('utf8');
      // strip width/height to make sure they scale properly
      text = text.replace(/width=\`"[\d\.]+(px)?\`"/, '').replace(/height=\`"[\d\.]+(px)?\`"/, '');
      fs.writeFileSync('frontend/public/icons/payment/' + name, text);
      console.log('Saved ' + name);
    } else {
      console.log('Failed ' + name + ' ' + r.status);
    }
  } catch (e) {
    console.log('Error ' + name + ' ' + e.message);
  }
}
async function run() {
  await dl('https://upload.wikimedia.org/wikipedia/commons/d/d1/RuPay.svg', 'rupay.svg');
  await dl('https://upload.wikimedia.org/wikipedia/commons/c/cd/PayU.svg', 'payu.svg');
  await dl('https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg', 'upi.svg');
}
run();
