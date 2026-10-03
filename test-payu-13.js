const fetch = require('node-fetch');
fetch('https://sandboxsecure.payu.in/_payment')
  .then(res => console.log('Status:', res.status))
  .catch(console.error);
