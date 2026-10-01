const http = require('http');

http.get('http://localhost:4000/api/v1/products/lone-ranger-mashak-hydration-backpack', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if(parsed.data) {
        console.log("Product:", parsed.data.name);
        console.log("Images:");
        parsed.data.images.forEach((img, i) => {
           console.log(`[${i}] url: ${img.url}`);
           console.log(`    altText: ${img.altText}`);
        });
      } else {
        console.log(parsed);
      }
    } catch(e) { console.log(e); }
  });
}).on('error', console.error);
