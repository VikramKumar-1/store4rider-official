const http = require('http');

http.get('http://localhost:4000/api/v1/products/lone-ranger-mashak-hydration-backpack', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if(parsed.data) {
        console.log("Colors:", parsed.data.configurableVariations);
        parsed.data.variants.forEach(v => {
           console.log("Variant:", v.attributes);
        });
      }
    } catch(e) { console.log(e); }
  });
}).on('error', console.error);
