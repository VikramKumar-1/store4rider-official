const http = require('http');

http.get('http://localhost:4000/api/v1/products?limit=100', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data).data.items;
      parsed.forEach(p => {
         const hasYellow = p.variants?.some(v => v.attributes?.color?.toLowerCase().includes('yellow'));
         if (hasYellow) {
            console.log("Found:", p.slug);
         }
      });
    } catch(e) { console.log(e); }
  });
}).on('error', console.error);
