const fetch = require('node-fetch');
fetch('https://apitest.payu.in/webcheckoutpro/re3-6HvLARZ2LKbt_h5Iwns3Xw/')
  .then(res => res.text())
  .then(text => {
    console.log(text.substring(0, 1000));
  })
  .catch(console.error);
