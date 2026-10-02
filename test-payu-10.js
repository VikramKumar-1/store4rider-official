const fetch = require('node-fetch');
fetch('https://apitest.payu.in/webcheckoutpro/re3-6HvLARZ2LKbt_h5Iwns3Xw/')
  .then(res => res.text())
  .then(html => {
    const regex = /<script.*?src="(.*?)".*?><\/script>/g;
    let match;
    const scripts = [];
    while ((match = regex.exec(html)) !== null) {
      scripts.push(match[1]);
    }
    console.log("Scripts:", scripts);
    
    scripts.forEach(src => {
      const url = src.startsWith('http') ? src : 'https://apitest.payu.in/webcheckoutpro/re3-6HvLARZ2LKbt_h5Iwns3Xw/' + src.replace('./', '');
      fetch(url).then(r => r.text()).then(js => {
        if (js.includes('No payment ID found')) {
          console.log('FOUND IN:', url);
          const idx = js.indexOf('No payment ID found');
          console.log(js.substring(idx - 500, idx + 500));
        }
      });
    });
  });
