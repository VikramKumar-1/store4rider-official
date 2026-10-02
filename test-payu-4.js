const fetch = require('node-fetch');
fetch('https://apitest.payu.in/webcheckoutpro/re3-6HvLARZ2LKbt_h5Iwns3Xw/#/92906aad352c6d741792df1f75ae50b7652ed81c87e9ca4ade29641326948008')
  .then(res => res.text())
  .then(text => console.log('Length:', text.length))
  .catch(console.error);
